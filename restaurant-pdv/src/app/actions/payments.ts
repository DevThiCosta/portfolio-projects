"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import type { Prisma } from "@/generated/prisma/client";
import { createPixCharge, getPixPaymentStatus, isPixConfigured } from "@/lib/mercadopago";

/** Evita comparações de ponto flutuante em dinheiro — tudo em centavos inteiros. */
function toCents(amount: number) {
  return Math.round(amount * 100);
}

function computeTotal(items: { unitPriceAtOrder: Prisma.Decimal | number; quantity: number }[]) {
  const cents = items.reduce(
    (sum, i) => sum + toCents(Number(i.unitPriceAtOrder)) * i.quantity,
    0
  );
  return cents / 100;
}

async function getComandaTotal(comandaId: string) {
  const comanda = await prisma.comanda.findUniqueOrThrow({
    where: { id: comandaId },
    include: {
      items: { where: { status: { not: "CANCELLED" } }, orderBy: { createdAt: "asc" } },
    },
  });
  return { comanda, total: computeTotal(comanda.items) };
}

/** Envia à cozinha qualquer item ainda PENDING antes de fechar — um pedido pago nunca deve deixar de chegar à cozinha. */
async function flushPendingItemsToKitchen(tx: Prisma.TransactionClient, comandaId: string) {
  const pendingItems = await tx.comandaItem.findMany({
    where: { comandaId, status: "PENDING" },
    include: { product: true },
  });
  if (pendingItems.length === 0) return;

  const comanda = await tx.comanda.findUniqueOrThrow({
    where: { id: comandaId },
    include: { mesa: true },
  });

  await tx.comandaItem.updateMany({
    where: { id: { in: pendingItems.map((i) => i.id) } },
    data: { status: "SENT_TO_KITCHEN" },
  });

  await tx.printJob.create({
    data: {
      comandaId,
      payload: {
        mesa: comanda.mesa.label,
        sentAt: new Date().toISOString(),
        items: pendingItems.map((i) => ({
          productName: i.product.name,
          quantity: i.quantity,
          notes: i.notes,
        })),
      },
    },
  });
}

/**
 * Baixa de estoque + fechamento da comanda — chamado depois que o pagamento
 * total já está confirmado.
 *
 * Idempotente e concorrência-segura: o `updateMany` condicional
 * (`WHERE status = 'OPEN'`) é a guarda atômica — se outra transação já
 * fechou a comanda entre a leitura e a escrita (ex: caixa fecha em dinheiro
 * no mesmo instante em que um webhook de Pix atrasado chega), o `count`
 * retorna 0 e nada mais é feito. Isso cobre tanto o caso sequencial (Pix
 * confirmado bem depois de a comanda já ter fechado por outro meio) quanto
 * a corrida concorrente de verdade — o `UPDATE` do Postgres serializa as
 * duas transações.
 */
async function closeComandaAndDecrementStock(
  tx: Prisma.TransactionClient,
  comandaId: string
) {
  await flushPendingItemsToKitchen(tx, comandaId);

  const claimed = await tx.comanda.updateMany({
    where: { id: comandaId, status: "OPEN" },
    data: { status: "CLOSED", closedAt: new Date() },
  });
  if (claimed.count === 0) return;

  const items = await tx.comandaItem.findMany({
    where: { comandaId, status: { not: "CANCELLED" } },
    include: { product: true },
  });

  for (const item of items) {
    if (item.product.stock === null) continue;
    await tx.stockMovement.create({
      data: {
        productId: item.productId,
        delta: -item.quantity,
        reason: "venda",
        relatedComandaId: comandaId,
      },
    });
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }
}

const CashSchema = z.object({
  comandaId: z.string().min(1),
  amountReceived: z.coerce.number().min(0),
});

export type CashPaymentState = { error?: string } | undefined;

export async function closeComandaWithCash(
  _state: CashPaymentState,
  formData: FormData
): Promise<CashPaymentState> {
  const session = await requireRole(["CAIXA", "ADMIN"], "/login");

  const parsed = CashSchema.safeParse({
    comandaId: formData.get("comandaId"),
    amountReceived: formData.get("amountReceived"),
  });
  if (!parsed.success) {
    return { error: "Valor inválido." };
  }

  const { comanda, total } = await getComandaTotal(parsed.data.comandaId);
  if (comanda.status !== "OPEN") {
    return { error: "Esta comanda já não está mais aberta." };
  }
  if (toCents(parsed.data.amountReceived) < toCents(total)) {
    return { error: "Valor recebido é menor que o total da comanda." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        comandaId: comanda.id,
        method: "DINHEIRO",
        amount: total,
        status: "CONFIRMED",
        confirmedAt: new Date(),
        receivedByUserId: session.userId,
      },
    });
    await closeComandaAndDecrementStock(tx, comanda.id);
  });

  revalidatePath("/caixa");
  redirect("/caixa");
}

export { getComandaTotal, closeComandaAndDecrementStock };

export async function createPixPaymentForComanda(comandaId: string) {
  const session = await requireRole(["CAIXA", "ADMIN"], "/login");

  if (!isPixConfigured()) {
    throw new Error(
      "Pix não configurado — defina MERCADO_PAGO_ACCESS_TOKEN no .env do servidor."
    );
  }

  const { comanda, total } = await getComandaTotal(comandaId);
  if (comanda.status !== "OPEN") {
    throw new Error("Esta comanda já não está mais aberta.");
  }

  const existingPending = await prisma.payment.findFirst({
    where: { comandaId, method: "PIX", status: "PENDING" },
  });
  if (existingPending) return;

  const appUrl = process.env.APP_URL;
  const charge = await createPixCharge({
    comandaId,
    amount: total,
    description: `Bar POS — ${comanda.mesaId}`,
    notificationUrl: appUrl ? `${appUrl}/api/webhooks/mercadopago` : undefined,
  });

  await prisma.payment.create({
    data: {
      comandaId,
      method: "PIX",
      amount: total,
      status: "PENDING",
      gatewayPaymentId: charge.paymentId,
      gatewayQrCode: JSON.stringify({
        qrCode: charge.qrCode,
        qrCodeBase64: charge.qrCodeBase64,
      }),
      receivedByUserId: session.userId,
    },
  });

  revalidatePath(`/caixa/comanda/${comandaId}/pix`);
}

const TERMINAL_FAILED_STATUSES = new Set(["rejected", "cancelled"]);

/** Usado tanto pelo webhook quanto pela checagem manual — confirma e fecha a comanda se o Pix foi aprovado. */
export async function confirmPixPaymentIfApproved(gatewayPaymentId: string) {
  const payment = await prisma.payment.findFirst({
    where: { gatewayPaymentId, method: "PIX" },
  });
  if (!payment || payment.status !== "PENDING") {
    return payment?.status ?? null;
  }

  const { status } = await getPixPaymentStatus(gatewayPaymentId);

  if (TERMINAL_FAILED_STATUSES.has(status ?? "")) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    return status;
  }

  if (status !== "approved") return status;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    });

    // A cobrança Pix trava o valor no momento em que foi gerada. Se itens
    // foram adicionados à comanda depois disso (e ela continua aberta),
    // fechar agora faria a casa perder a diferença — em vez disso, deixa a
    // comanda aberta pra o caixa cobrar o restante por outro meio.
    const currentItems = await tx.comandaItem.findMany({
      where: { comandaId: payment.comandaId, status: { not: "CANCELLED" } },
    });
    const currentTotal = computeTotal(currentItems);
    if (toCents(currentTotal) > toCents(Number(payment.amount))) {
      return;
    }

    await closeComandaAndDecrementStock(tx, payment.comandaId);
  });

  return "approved";
}

/**
 * Cartão é cobrado num terminal físico separado (fora do sistema), sem SDK
 * integrado nesta fase — o caixa apenas confirma que o terminal aprovou.
 * Ver seção 6/10 do plano para o caminho de evolução (Capacitor + SDK do
 * terminal) caso decidam eliminar esse passo manual no futuro.
 */
export async function closeComandaWithCardTerminal(comandaId: string) {
  const session = await requireRole(["CAIXA", "ADMIN"], "/login");

  const { comanda, total } = await getComandaTotal(comandaId);
  if (comanda.status !== "OPEN") {
    throw new Error("Esta comanda já não está mais aberta.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        comandaId,
        method: "CARTAO_TERMINAL",
        amount: total,
        status: "CONFIRMED",
        confirmedAt: new Date(),
        receivedByUserId: session.userId,
      },
    });
    await closeComandaAndDecrementStock(tx, comandaId);
  });

  revalidatePath("/caixa");
  redirect("/caixa");
}

export async function refreshPixPaymentStatus(comandaId: string) {
  await requireRole(["CAIXA", "ADMIN"], "/login");

  const payment = await prisma.payment.findFirst({
    where: { comandaId, method: "PIX", status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  if (!payment?.gatewayPaymentId) return;

  await confirmPixPaymentIfApproved(payment.gatewayPaymentId);
  revalidatePath(`/caixa/comanda/${comandaId}/pix`);
  revalidatePath("/caixa");
}
