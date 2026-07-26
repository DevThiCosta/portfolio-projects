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

function centsToAmount(cents: number) {
  return cents / 100;
}

function computeTotal(items: { unitPriceAtOrder: Prisma.Decimal | number; quantity: number }[]) {
  const cents = items.reduce(
    (sum, i) => sum + toCents(Number(i.unitPriceAtOrder)) * i.quantity,
    0
  );
  return centsToAmount(cents);
}

/**
 * Total da comanda, quanto já foi pago (pagamentos CONFIRMED) e quanto ainda
 * falta cobrar. `amountDue` é o que o caixa deve efetivamente pedir/validar
 * — importa quando já existe um pagamento parcial (ex: Pix confirmado, mas
 * itens foram adicionados depois e a comanda continua aberta pra cobrar a
 * diferença).
 */
async function getComandaBalance(comandaId: string) {
  const comanda = await prisma.comanda.findUniqueOrThrow({
    where: { id: comandaId },
    include: {
      items: { where: { status: { not: "CANCELLED" } }, orderBy: { createdAt: "asc" } },
      payments: { where: { status: "CONFIRMED" } },
    },
  });
  const totalCents = toCents(computeTotal(comanda.items));
  const paidCents = comanda.payments.reduce((sum, p) => sum + toCents(Number(p.amount)), 0);
  const amountDue = centsToAmount(Math.max(0, totalCents - paidCents));
  return { comanda, total: centsToAmount(totalCents), amountDue };
}

/** Mantido para a tela do cartão, que só precisa do total/saldo — mesma lógica de getComandaBalance. */
async function getComandaTotal(comandaId: string) {
  const { comanda, total, amountDue } = await getComandaBalance(comandaId);
  return { comanda, total, amountDue };
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

async function decrementStockForComanda(tx: Prisma.TransactionClient, comandaId: string) {
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

/**
 * Tenta reivindicar o fechamento da comanda de forma atômica: só quem
 * conseguir esse `UPDATE ... WHERE status = 'OPEN'` é quem realmente fecha.
 * Precisa rodar ANTES de criar qualquer `Payment`, nunca depois — se
 * corresse depois, duas tentativas concorrentes de fechar a mesma comanda
 * (ex: caixa clica duas vezes, ou dois meios de pagamento fecham ao mesmo
 * tempo) já teriam criado dois registros de pagamento antes de qualquer uma
 * delas descobrir que perdeu a corrida, já que tudo roda na mesma transação
 * e um `return` antecipado não desfaz o que já rodou antes dele.
 */
async function claimOpenComanda(tx: Prisma.TransactionClient, comandaId: string): Promise<boolean> {
  const claimed = await tx.comanda.updateMany({
    where: { id: comandaId, status: "OPEN" },
    data: { status: "CLOSED", closedAt: new Date() },
  });
  return claimed.count > 0;
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

  const { comanda, amountDue } = await getComandaBalance(parsed.data.comandaId);
  if (comanda.status !== "OPEN") {
    return { error: "Esta comanda já não está mais aberta." };
  }
  if (toCents(parsed.data.amountReceived) < toCents(amountDue)) {
    return { error: "Valor recebido é menor que o valor devido." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await claimOpenComanda(tx, comanda.id);
      if (!claimed) {
        throw new Error("Esta comanda acabou de ser fechada por outra ação.");
      }
      await flushPendingItemsToKitchen(tx, comanda.id);
      await tx.payment.create({
        data: {
          comandaId: comanda.id,
          method: "DINHEIRO",
          amount: amountDue,
          status: "CONFIRMED",
          confirmedAt: new Date(),
          receivedByUserId: session.userId,
        },
      });
      await decrementStockForComanda(tx, comanda.id);
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao fechar comanda." };
  }

  revalidatePath("/caixa");
  redirect("/caixa");
}

export { getComandaTotal };

export async function createPixPaymentForComanda(comandaId: string) {
  const session = await requireRole(["CAIXA", "ADMIN"], "/login");

  if (!isPixConfigured()) {
    throw new Error(
      "Pix não configurado — defina MERCADO_PAGO_ACCESS_TOKEN no .env do servidor."
    );
  }

  const { comanda, amountDue } = await getComandaBalance(comandaId);
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
    amount: amountDue,
    description: `Bar POS — ${comanda.mesaId}`,
    notificationUrl: appUrl ? `${appUrl}/api/webhooks/mercadopago` : undefined,
  });

  await prisma.payment.create({
    data: {
      comandaId,
      method: "PIX",
      amount: amountDue,
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
    // A confirmação em si (o dinheiro chegou de verdade) é sempre gravada,
    // mesmo que a comanda não possa mais ser fechada agora — ver checagens
    // abaixo. `payment.status !== "PENDING"` no topo desta função já
    // impede que isso rode duas vezes para o mesmo pagamento.
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    });

    // A cobrança Pix trava o valor no momento em que foi gerada. Se itens
    // foram adicionados à comanda depois disso, fechar agora faria a casa
    // perder a diferença — em vez disso, deixa a comanda aberta pra o caixa
    // cobrar o restante por outro meio (getComandaBalance já desconta esse
    // Pix confirmado do saldo devedor).
    const currentItems = await tx.comandaItem.findMany({
      where: { comandaId: payment.comandaId, status: { not: "CANCELLED" } },
    });
    const currentTotal = computeTotal(currentItems);
    if (toCents(currentTotal) > toCents(Number(payment.amount))) {
      return;
    }

    const claimed = await claimOpenComanda(tx, payment.comandaId);
    if (!claimed) {
      // Comanda já foi fechada por outro meio nesse meio-tempo. O Pix acima
      // de qualquer forma já ficou CONFIRMED — é um pagamento real recebido
      // que precisa de reconciliação manual (provavelmente reembolso), não
      // algo que o software deveria tentar "desfazer" ou esconder.
      return;
    }

    await flushPendingItemsToKitchen(tx, payment.comandaId);
    await decrementStockForComanda(tx, payment.comandaId);
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

  const { comanda, amountDue } = await getComandaBalance(comandaId);
  if (comanda.status !== "OPEN") {
    throw new Error("Esta comanda já não está mais aberta.");
  }

  await prisma.$transaction(async (tx) => {
    const claimed = await claimOpenComanda(tx, comandaId);
    if (!claimed) {
      throw new Error("Esta comanda acabou de ser fechada por outra ação.");
    }
    await flushPendingItemsToKitchen(tx, comandaId);
    await tx.payment.create({
      data: {
        comandaId,
        method: "CARTAO_TERMINAL",
        amount: amountDue,
        status: "CONFIRMED",
        confirmedAt: new Date(),
        receivedByUserId: session.userId,
      },
    });
    await decrementStockForComanda(tx, comandaId);
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
