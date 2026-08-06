"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { computeInstallments } from "@/lib/expenses";
import { applyInsumoMovement } from "@/lib/stock";
import { flashSuccess } from "@/lib/flash";
import { brazilDateFromLabel } from "@/lib/timezone";
import { toCents, centsToAmount } from "@/lib/money";

const PurchaseHeaderSchema = z.object({
  supplierId: z.string().trim().optional(),
  issuedAt: z.string().trim().min(1, "Informe a data"),
  paymentTerm: z.enum(["AVISTA", "PRAZO_UNICO", "PRAZO_PARCELADO"]),
  installmentsCount: z.coerce.number().int().min(1).max(36).default(1),
  installmentIntervalDays: z.coerce.number().int().min(1).max(365).default(30),
  firstDueDate: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

const PurchaseItemSchema = z.object({
  insumoId: z.string().trim().optional(),
  description: z.string().trim().min(1, "Descreva o item"),
  quantity: z.coerce.number().positive("Quantidade deve ser maior que zero"),
  unitCost: z.coerce.number().positive("Custo unitário deve ser maior que zero"),
});

export type PurchaseFormState = { error?: string } | undefined;

/** Lê `items.0.*`, `items.1.*`... do FormData até não achar mais linhas. */
function readItemRows(formData: FormData) {
  const rows: { insumoId?: string; description: string; quantity: string; unitCost: string }[] = [];
  for (let i = 0; formData.get(`items.${i}.unitCost`) !== null; i++) {
    rows.push({
      insumoId: (formData.get(`items.${i}.insumoId`) as string) || undefined,
      description: (formData.get(`items.${i}.description`) as string) ?? "",
      quantity: (formData.get(`items.${i}.quantity`) as string) ?? "",
      unitCost: (formData.get(`items.${i}.unitCost`) as string) ?? "",
    });
  }
  return rows;
}

export async function createPurchase(
  _state: PurchaseFormState,
  formData: FormData
): Promise<PurchaseFormState> {
  const session = await requireRole(["ADMIN"], "/admin/login");

  const header = PurchaseHeaderSchema.safeParse({
    supplierId: formData.get("supplierId") || undefined,
    issuedAt: formData.get("issuedAt"),
    paymentTerm: formData.get("paymentTerm"),
    installmentsCount: formData.get("installmentsCount") || 1,
    installmentIntervalDays: formData.get("installmentIntervalDays") || 30,
    firstDueDate: formData.get("firstDueDate") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!header.success) {
    return { error: header.error.issues[0].message };
  }
  if (header.data.paymentTerm !== "AVISTA" && !header.data.firstDueDate) {
    return { error: "Informe a data de vencimento" };
  }

  const rawItems = readItemRows(formData);
  if (rawItems.length === 0) {
    return { error: "Adicione ao menos um item à compra" };
  }

  const items: {
    insumoId?: string;
    description: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }[] = [];
  for (const raw of rawItems) {
    const parsedItem = PurchaseItemSchema.safeParse(raw);
    if (!parsedItem.success) {
      return { error: parsedItem.error.issues[0].message };
    }
    const { insumoId, description, quantity, unitCost } = parsedItem.data;
    items.push({
      insumoId,
      description,
      quantity,
      unitCost,
      totalCost: centsToAmount(toCents(quantity * unitCost)),
    });
  }

  const amount = items.reduce((sum, item) => sum + item.totalCost, 0);
  const kind = items.some((i) => i.insumoId) ? "COMPRA_INSUMO" : "COMPRA_SERVICO";

  const issuedAt = brazilDateFromLabel(header.data.issuedAt);
  const firstDueDate = header.data.firstDueDate
    ? brazilDateFromLabel(header.data.firstDueDate)
    : undefined;
  const installments = computeInstallments({
    paymentTerm: header.data.paymentTerm,
    amount,
    installmentsCount: header.data.installmentsCount,
    intervalDays: header.data.installmentIntervalDays,
    firstDueDate,
    issuedAt,
  });

  const supplier = header.data.supplierId
    ? await prisma.supplier.findUnique({ where: { id: header.data.supplierId } })
    : null;
  const itemsSummary = items.map((i) => i.description).slice(0, 3).join(", ");
  const description = supplier ? `${supplier.name} — ${itemsSummary}` : `Compra — ${itemsSummary}`;

  const expenseId = await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        kind,
        description,
        category: kind === "COMPRA_INSUMO" ? "Insumos" : "Serviços",
        supplierId: header.data.supplierId || undefined,
        amount,
        paymentTerm: header.data.paymentTerm,
        installmentsCount: installments.length,
        installmentIntervalDays: header.data.installmentIntervalDays,
        issuedAt,
        notes: header.data.notes || undefined,
        createdByUserId: session.userId,
        items: { create: items },
        installments: { create: installments },
      },
    });

    for (const item of items) {
      if (!item.insumoId) continue;
      await applyInsumoMovement(tx, item.insumoId, item.quantity, {
        reason: "reposição (compra)",
        relatedExpenseId: expense.id,
        createdByUserId: session.userId,
      });
    }

    return expense.id;
  });

  revalidatePath("/admin/custos/compras");
  revalidatePath("/admin/custos");
  revalidatePath("/admin/insumos");
  revalidatePath("/admin/estoque");
  await flashSuccess("Compra registrada");
  redirect(`/admin/custos/compras/${expenseId}`);
}
