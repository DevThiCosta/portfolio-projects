"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import type { Prisma } from "@/generated/prisma/client";
import { createPixCharge, isPixConfigured } from "@/lib/mercadopago";
import { toCents, centsToAmount } from "@/lib/money";
import { flushPendingItemsToKitchen } from "@/lib/kitchen";
import { computeTotal, claimOpenComanda, confirmPixPaymentIfApproved } from "@/lib/pix-confirmation";

/**
 * Total da comanda, quanto já foi pago (pagamentos CONFIRMED) e quanto ainda
 * falta cobrar. `amountDue` é o que o caixa deve efetivamente pedir/validar
 * — importa quando já existe um pagamento parcial (ex: Pix confirmado, mas
 * itens foram adicionados depois e a comanda continua aberta pra cobrar a
 * diferença).
 *
 * Aceita `client` opcional pra poder rodar dentro de uma transação — usado
 * pelo fechamento em dinheiro pra reconfirmar o saldo devido no exato
 * momento em que a comanda é reivindicada, não com o valor calculado antes
 * da transação começar (que pode estar desatualizado se um Pix for
 * confirmado nesse meio-tempo).
 */
async function getComandaBalance(
  comandaId: string,
  client: Prisma.TransactionClient | typeof prisma = prisma
) {
  const comanda = await client.comanda.findUniqueOrThrow({
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
  await requireRole(["CAIXA", "ADMIN"], "/login");
  const { comanda, total, amountDue } = await getComandaBalance(comandaId);
  return { comanda, total, amountDue };
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

  const { comanda } = await getComandaBalance(parsed.data.comandaId);
  if (comanda.status !== "OPEN") {
    return { error: "Esta comanda já não está mais aberta." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await claimOpenComanda(tx, comanda.id);
      if (!claimed) {
        throw new Error("Esta comanda acabou de ser fechada por outra ação.");
      }

      // Recalcula o saldo devido AQUI DENTRO, depois de reivindicar a
      // comanda — não usa o valor computado antes da transação. Entre esse
      // cálculo inicial e este ponto, um Pix pode ter sido confirmado pelo
      // webhook (fluxo independente, fora do controle desta função) e
      // reduzido o saldo devedor; cobrar o valor antigo em dinheiro
      // registraria mais receita do que a comanda realmente tem a receber.
      const { amountDue } = await getComandaBalance(comanda.id, tx);
      if (toCents(parsed.data.amountReceived) < toCents(amountDue)) {
        throw new Error("Valor recebido é menor que o valor devido — o saldo mudou, confira novamente.");
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
      // Estoque já foi reservado quando os itens foram pedidos (ver
      // src/lib/stock.ts) — não há baixa a fazer aqui no fechamento.
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
