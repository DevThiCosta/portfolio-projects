"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";

const InsumoSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto"),
  unit: z.string().trim().min(1, "Informe a unidade (ml, g, un...)"),
  stock: z.coerce.number().min(0),
  lowStockThreshold: z.coerce.number().min(0).optional(),
});

export type InsumoFormState = { error?: string } | undefined;

export async function createInsumo(
  _state: InsumoFormState,
  formData: FormData
): Promise<InsumoFormState> {
  await requireRole(["ADMIN"], "/admin/login");

  const parsed = InsumoSchema.safeParse({
    name: formData.get("name"),
    unit: formData.get("unit"),
    stock: formData.get("stock") || 0,
    lowStockThreshold: formData.get("lowStockThreshold") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await prisma.insumo.create({
    data: {
      name: parsed.data.name,
      unit: parsed.data.unit,
      stock: parsed.data.stock,
      lowStockThreshold: parsed.data.lowStockThreshold,
    },
  });

  revalidatePath("/admin/insumos");
  redirect("/admin/insumos");
}

const AdjustSchema = z.object({
  insumoId: z.string().min(1),
  delta: z.coerce.number().refine((v) => v !== 0, "Informe uma quantidade diferente de zero"),
  reason: z.string().trim().min(2, "Descreva o motivo"),
});

export type InsumoAdjustState = { error?: string } | undefined;

export async function adjustInsumoStock(
  _state: InsumoAdjustState,
  formData: FormData
): Promise<InsumoAdjustState> {
  const session = await requireRole(["ADMIN"], "/admin/login");

  const parsed = AdjustSchema.safeParse({
    insumoId: formData.get("insumoId"),
    delta: formData.get("delta"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await prisma.$transaction([
    prisma.insumoMovement.create({
      data: {
        insumoId: parsed.data.insumoId,
        delta: parsed.data.delta,
        reason: parsed.data.reason,
        createdByUserId: session.userId,
      },
    }),
    prisma.insumo.update({
      where: { id: parsed.data.insumoId },
      data: { stock: { increment: parsed.data.delta } },
    }),
  ]);

  revalidatePath("/admin/insumos");
}

export async function toggleInsumoActive(insumoId: string, active: boolean) {
  await requireRole(["ADMIN"], "/admin/login");
  await prisma.insumo.update({ where: { id: insumoId }, data: { active } });
  revalidatePath("/admin/insumos");
}

const IngredientSchema = z.object({
  productId: z.string().min(1),
  insumoId: z.string().min(1),
  quantityPerUnit: z.coerce.number().positive("Quantidade deve ser maior que zero"),
});

export type IngredientFormState = { error?: string } | undefined;

export async function addIngredient(
  productId: string,
  _state: IngredientFormState,
  formData: FormData
): Promise<IngredientFormState> {
  await requireRole(["ADMIN"], "/admin/login");

  const parsed = IngredientSchema.safeParse({
    productId,
    insumoId: formData.get("insumoId"),
    quantityPerUnit: formData.get("quantityPerUnit"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await prisma.productIngredient.create({ data: parsed.data });
  } catch {
    return { error: "Este insumo já está na receita — remova e adicione de novo pra alterar." };
  }

  revalidatePath(`/admin/produtos/${productId}`);
}

export async function removeIngredient(ingredientId: string, productId: string) {
  await requireRole(["ADMIN"], "/admin/login");
  await prisma.productIngredient.delete({ where: { id: ingredientId } });
  revalidatePath(`/admin/produtos/${productId}`);
}
