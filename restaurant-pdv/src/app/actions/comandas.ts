"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { reserveStock, releaseStock } from "@/lib/stock";

/** Abre uma comanda para a mesa, ou retorna a já aberta (idempotente). */
export async function openComanda(mesaId: string) {
  const session = await requireRole(["GARCOM", "ADMIN"], "/login");

  const existing = await prisma.comanda.findFirst({
    where: { mesaId, status: "OPEN" },
  });
  if (existing) return existing;

  try {
    const comanda = await prisma.comanda.create({
      data: { mesaId, openedByUserId: session.userId, source: "STAFF" },
    });
    revalidatePath(`/garcom/mesa/${mesaId}`);
    return comanda;
  } catch (e) {
    // Corrida entre dois garçons abrindo a mesma mesa ao mesmo tempo —
    // o índice único parcial (mesaId, status=OPEN) barra o segundo insert.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const comanda = await prisma.comanda.findFirst({
        where: { mesaId, status: "OPEN" },
      });
      if (comanda) return comanda;
    }
    throw e;
  }
}

/** Wrapper sem retorno, para uso direto como `action` de um `<form>`. */
export async function openComandaFormAction(mesaId: string) {
  await openComanda(mesaId);
}

const AddItemSchema = z.object({
  comandaId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(50),
  notes: z.string().trim().max(200).optional(),
});

export async function addItemToComanda(formData: FormData) {
  const session = await requireRole(["GARCOM", "ADMIN"], "/login");

  const parsed = AddItemSchema.parse({
    comandaId: formData.get("comandaId"),
    productId: formData.get("productId"),
    quantity: formData.get("quantity") ?? 1,
    notes: formData.get("notes") || undefined,
  });

  const [comanda, product] = await Promise.all([
    prisma.comanda.findUniqueOrThrow({ where: { id: parsed.comandaId } }),
    prisma.product.findUniqueOrThrow({ where: { id: parsed.productId } }),
  ]);

  if (comanda.status !== "OPEN") {
    throw new Error("Comanda não está mais aberta.");
  }

  // O estoque (do produto ou dos insumos da receita) é reservado agora, no
  // pedido — não só no fechamento — pra impedir vender mais do que existe
  // quando várias mesas pedem o mesmo item ao mesmo tempo.
  await prisma.$transaction(async (tx) => {
    await reserveStock(tx, product.id, parsed.quantity, {
      relatedComandaId: comanda.id,
      createdByUserId: session.userId,
      reason: "venda",
    });

    await tx.comandaItem.create({
      data: {
        comandaId: comanda.id,
        productId: product.id,
        quantity: parsed.quantity,
        unitPriceAtOrder: product.price,
        notes: parsed.notes,
        createdByUserId: session.userId,
      },
    });
  });

  revalidatePath(`/garcom/mesa/${comanda.mesaId}`);
}

export async function cancelPendingItem(itemId: string) {
  const session = await requireRole(["GARCOM", "ADMIN"], "/login");

  const item = await prisma.comandaItem.findUniqueOrThrow({
    where: { id: itemId },
    include: { comanda: true },
  });
  if (item.status !== "PENDING") {
    throw new Error("Só é possível cancelar itens ainda não enviados à cozinha.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.comandaItem.update({
      where: { id: itemId },
      data: { status: "CANCELLED" },
    });
    await releaseStock(tx, item.productId, item.quantity, {
      relatedComandaId: item.comandaId,
      createdByUserId: session.userId,
      reason: "item cancelado",
    });
  });

  revalidatePath(`/garcom/mesa/${item.comanda.mesaId}`);
}

/** Marca os itens pendentes como enviados e cria o ticket de impressão. */
export async function sendToKitchen(comandaId: string) {
  await requireRole(["GARCOM", "ADMIN"], "/login");

  const comanda = await prisma.comanda.findUniqueOrThrow({
    where: { id: comandaId },
    include: { mesa: true },
  });

  await prisma.$transaction(async (tx) => {
    const pendingItems = await tx.comandaItem.findMany({
      where: { comandaId, status: "PENDING" },
      include: { product: true },
    });

    if (pendingItems.length === 0) return;

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
  });

  revalidatePath(`/garcom/mesa/${comanda.mesaId}`);
  redirect("/garcom");
}
