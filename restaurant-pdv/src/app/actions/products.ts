"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { flashSuccess } from "@/lib/flash";

const ProductSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto"),
  category: z.string().trim().min(2, "Categoria muito curta"),
  price: z.coerce.number().positive("Preço deve ser maior que zero"),
  trackStock: z.coerce.boolean().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
});

export type ProductFormState = { error?: string } | undefined;

function parseProductForm(formData: FormData) {
  const trackStock = formData.get("trackStock") === "on";
  return ProductSchema.parse({
    name: formData.get("name"),
    category: formData.get("category"),
    price: formData.get("price"),
    trackStock,
    stock: trackStock ? formData.get("stock") || 0 : undefined,
    lowStockThreshold: trackStock
      ? formData.get("lowStockThreshold") || 0
      : undefined,
  });
}

export async function createProduct(
  _state: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireRole(["ADMIN"], "/admin/login");

  let data;
  try {
    data = parseProductForm(formData);
  } catch (e) {
    return { error: e instanceof z.ZodError ? e.issues[0].message : "Dados inválidos" };
  }

  await prisma.product.create({
    data: {
      name: data.name,
      category: data.category,
      price: data.price,
      stock: data.trackStock ? data.stock ?? 0 : null,
      lowStockThreshold: data.trackStock ? data.lowStockThreshold ?? 0 : null,
    },
  });

  revalidatePath("/admin/produtos");
  await flashSuccess("Produto criado");
  redirect("/admin/produtos");
}

export async function updateProduct(
  productId: string,
  _state: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireRole(["ADMIN"], "/admin/login");

  let data;
  try {
    data = parseProductForm(formData);
  } catch (e) {
    return { error: e instanceof z.ZodError ? e.issues[0].message : "Dados inválidos" };
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      name: data.name,
      category: data.category,
      price: data.price,
      stock: data.trackStock ? data.stock ?? 0 : null,
      lowStockThreshold: data.trackStock ? data.lowStockThreshold ?? 0 : null,
    },
  });

  revalidatePath("/admin/produtos");
  await flashSuccess("Produto atualizado");
  redirect("/admin/produtos");
}

export async function toggleProductActive(productId: string, active: boolean) {
  await requireRole(["ADMIN"], "/admin/login");
  await prisma.product.update({ where: { id: productId }, data: { active } });
  revalidatePath("/admin/produtos");
}
