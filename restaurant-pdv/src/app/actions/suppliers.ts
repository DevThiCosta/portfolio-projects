"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { flashSuccess } from "@/lib/flash";

const SupplierSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto"),
  kind: z.enum(["INSUMO", "SERVICO", "AMBOS"]),
  document: z.string().trim().optional(),
  contactName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("E-mail inválido").optional().or(z.literal("")),
  notes: z.string().trim().optional(),
});

export type SupplierFormState = { error?: string } | undefined;

export async function createSupplier(
  _state: SupplierFormState,
  formData: FormData
): Promise<SupplierFormState> {
  await requireRole(["ADMIN"], "/admin/login");

  const parsed = SupplierSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind") || "AMBOS",
    document: formData.get("document") || undefined,
    contactName: formData.get("contactName") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await prisma.supplier.create({
    data: {
      ...parsed.data,
      email: parsed.data.email || undefined,
    },
  });

  revalidatePath("/admin/custos/fornecedores");
  await flashSuccess("Fornecedor criado");
  redirect("/admin/custos/fornecedores");
}

export async function updateSupplier(
  supplierId: string,
  _state: SupplierFormState,
  formData: FormData
): Promise<SupplierFormState> {
  await requireRole(["ADMIN"], "/admin/login");

  const parsed = SupplierSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind") || "AMBOS",
    document: formData.get("document") || undefined,
    contactName: formData.get("contactName") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await prisma.supplier.update({
    where: { id: supplierId },
    data: {
      ...parsed.data,
      email: parsed.data.email || undefined,
    },
  });

  revalidatePath("/admin/custos/fornecedores");
  await flashSuccess("Fornecedor atualizado");
  redirect("/admin/custos/fornecedores");
}

export async function toggleSupplierActive(supplierId: string, active: boolean) {
  await requireRole(["ADMIN"], "/admin/login");
  await prisma.supplier.update({ where: { id: supplierId }, data: { active } });
  revalidatePath("/admin/custos/fornecedores");
}
