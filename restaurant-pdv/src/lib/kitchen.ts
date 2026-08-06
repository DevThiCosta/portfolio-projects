import "server-only";
import type { Prisma } from "@/generated/prisma/client";

/** Envia à cozinha qualquer item ainda PENDING da comanda — usada tanto ao mandar manualmente quanto antes de fechar a conta, já que um pedido pago nunca deve deixar de chegar à cozinha. */
export async function flushPendingItemsToKitchen(tx: Prisma.TransactionClient, comandaId: string) {
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
