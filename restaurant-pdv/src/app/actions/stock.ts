"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";

const AdjustSchema = z.object({
  productId: z.string().min(1),
  delta: z.coerce.number().int().refine((v) => v !== 0, "Informe uma quantidade diferente de zero"),
  reason: z.string().trim().min(2, "Descreva o motivo"),
});

export type StockAdjustState = { error?: string } | undefined;

export async function adjustStock(
  _state: StockAdjustState,
  formData: FormData
): Promise<StockAdjustState> {
  const session = await requireRole(["ADMIN"], "/admin/login");

  const parsed = AdjustSchema.safeParse({
    productId: formData.get("productId"),
    delta: formData.get("delta"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const product = await prisma.product.findUniqueOrThrow({
    where: { id: parsed.data.productId },
  });
  if (product.stock === null) {
    return { error: "Este produto não tem controle de estoque ativado." };
  }

  await prisma.$transaction([
    prisma.stockMovement.create({
      data: {
        productId: product.id,
        delta: parsed.data.delta,
        reason: parsed.data.reason,
        createdByUserId: session.userId,
      },
    }),
    prisma.product.update({
      where: { id: product.id },
      data: { stock: { increment: parsed.data.delta } },
    }),
  ]);

  revalidatePath("/admin/estoque");
}
