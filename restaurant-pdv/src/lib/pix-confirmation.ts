import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getPixPaymentStatus } from "@/lib/mercadopago";
import { toCents, centsToAmount } from "@/lib/money";
import { flushPendingItemsToKitchen } from "@/lib/kitchen";

export function computeTotal(items: { unitPriceAtOrder: Prisma.Decimal | number; quantity: number }[]) {
  const cents = items.reduce(
    (sum, i) => sum + toCents(Number(i.unitPriceAtOrder)) * i.quantity,
    0
  );
  return centsToAmount(cents);
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
export async function claimOpenComanda(tx: Prisma.TransactionClient, comandaId: string): Promise<boolean> {
  const claimed = await tx.comanda.updateMany({
    where: { id: comandaId, status: "OPEN" },
    data: { status: "CLOSED", closedAt: new Date() },
  });
  return claimed.count > 0;
}

const TERMINAL_FAILED_STATUSES = new Set(["rejected", "cancelled"]);

/**
 * Confirma e fecha a comanda se o Pix foi aprovado — usado tanto pelo
 * webhook (não autenticado, validado pela assinatura do Mercado Pago) quanto
 * pela checagem manual do caixa (`refreshPixPaymentStatus`, que já exige
 * sessão CAIXA/ADMIN antes de chamar esta função). Fica fora de
 * `actions/payments.ts` ("use server") de propósito: qualquer função
 * exportada de um módulo "use server" vira um endpoint invocável
 * diretamente pelo cliente através do mecanismo de Server Actions do
 * Next.js, e esta função não faz — nem deveria fazer, já que o webhook
 * também precisa chamá-la — sua própria checagem de autorização.
 */
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
  });

  return "approved";
}
