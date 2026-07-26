"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import type { Prisma } from "@/generated/prisma/client";
import { createPixCharge, getPixPaymentStatus, isPixConfigured } from "@/lib/mercadopago";

async function getComandaTotal(comandaId: string) {
  const comanda = await prisma.comanda.findUniqueOrThrow({
    where: { id: comandaId },
    include: { items: { where: { status: { not: "CANCELLED" } } } },
  });
  const total = comanda.items.reduce(
    (sum, i) => sum + Number(i.unitPriceAtOrder) * i.quantity,
    0
  );
  return { comanda, total };
}

/**
 * Baixa de estoque + fechamento da comanda — chamado depois que o pagamento
 * total já está confirmado.
 *
 * Idempotente por design: se a comanda já não estiver mais OPEN, não faz
 * nada. Isso importa porque uma cobrança Pix pode ficar pendente depois que
 * a comanda já foi fechada por outro meio (ex: cliente paga um QR code Pix
 * antigo depois do caixa já ter fechado a conta em dinheiro) — sem essa
 * checagem, a confirmação tardia baixaria o estoque uma segunda vez e
 * duplicaria a receita nos relatórios.
 */
async function closeComandaAndDecrementStock(
  tx: Prisma.TransactionClient,
  comandaId: string
) {
  const comanda = await tx.comanda.findUniqueOrThrow({ where: { id: comandaId } });
  if (comanda.status !== "OPEN") return;

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

  await tx.comanda.update({
    where: { id: comandaId },
    data: { status: "CLOSED", closedAt: new Date() },
  });
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
  if (parsed.data.amountReceived < total) {
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

/** Usado tanto pelo webhook quanto pela checagem manual — confirma e fecha a comanda se o Pix foi aprovado. */
export async function confirmPixPaymentIfApproved(gatewayPaymentId: string) {
  const payment = await prisma.payment.findFirst({
    where: { gatewayPaymentId, method: "PIX" },
  });
  if (!payment || payment.status !== "PENDING") {
    return payment?.status ?? null;
  }

  const { status } = await getPixPaymentStatus(gatewayPaymentId);
  if (status !== "approved") return status;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    });
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
