"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { computeInstallments } from "@/lib/expenses";
import { applyInsumoMovement } from "@/lib/stock";
import { flashSuccess } from "@/lib/flash";
import {
  addCalendarMonthsBrazil,
  brazilDateFromLabel,
  brazilMonthStartFromLabel,
} from "@/lib/timezone";

const IdentitySchema = z.object({
  description: z.string().trim().min(2, "Descrição muito curta"),
  category: z.string().trim().min(1, "Informe a categoria"),
  supplierId: z.string().trim().optional(),
  competencia: z.string().trim().min(1, "Informe o mês de referência"),
  notes: z.string().trim().optional(),
});

const FinancialSchema = z.object({
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  paymentTerm: z.enum(["AVISTA", "PRAZO_UNICO", "PRAZO_PARCELADO"]),
  installmentsCount: z.coerce.number().int().min(1).max(36).default(1),
  installmentIntervalDays: z.coerce.number().int().min(1).max(365).default(30),
  issuedAt: z.string().trim().min(1, "Informe a data"),
  firstDueDate: z.string().trim().optional(),
});

const CreateExpenseSchema = IdentitySchema.extend({ kind: z.enum(["FIXA", "VARIAVEL"]) }).merge(
  FinancialSchema
);

export type ExpenseFormState = { error?: string } | undefined;

export async function createExpense(
  _state: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  const session = await requireRole(["ADMIN"], "/admin/login");

  const parsed = CreateExpenseSchema.safeParse({
    kind: formData.get("kind"),
    description: formData.get("description"),
    category: formData.get("category"),
    supplierId: formData.get("supplierId") || undefined,
    competencia: formData.get("competencia"),
    notes: formData.get("notes") || undefined,
    amount: formData.get("amount"),
    paymentTerm: formData.get("paymentTerm"),
    installmentsCount: formData.get("installmentsCount") || 1,
    installmentIntervalDays: formData.get("installmentIntervalDays") || 30,
    issuedAt: formData.get("issuedAt"),
    firstDueDate: formData.get("firstDueDate") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const data = parsed.data;
  if (data.paymentTerm !== "AVISTA" && !data.firstDueDate) {
    return { error: "Informe a data de vencimento" };
  }

  const issuedAt = brazilDateFromLabel(data.issuedAt);
  const firstDueDate = data.firstDueDate ? brazilDateFromLabel(data.firstDueDate) : undefined;
  const installments = computeInstallments({
    paymentTerm: data.paymentTerm,
    amount: data.amount,
    installmentsCount: data.installmentsCount,
    intervalDays: data.installmentIntervalDays,
    firstDueDate,
    issuedAt,
  });

  const expense = await prisma.expense.create({
    data: {
      kind: data.kind,
      description: data.description,
      category: data.category,
      supplierId: data.supplierId || undefined,
      amount: data.amount,
      paymentTerm: data.paymentTerm,
      installmentsCount: installments.length,
      installmentIntervalDays: data.installmentIntervalDays,
      issuedAt,
      competencia: brazilMonthStartFromLabel(data.competencia),
      notes: data.notes || undefined,
      createdByUserId: session.userId,
      installments: { create: installments },
    },
  });

  revalidatePath("/admin/custos/contas");
  revalidatePath("/admin/custos");
  await flashSuccess("Conta criada");
  redirect(`/admin/custos/contas/${expense.id}`);
}

export async function updateExpense(
  expenseId: string,
  _state: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  await requireRole(["ADMIN"], "/admin/login");

  const existing = await prisma.expense.findUniqueOrThrow({
    where: { id: expenseId },
    include: { installments: true },
  });
  if (existing.kind === "COMPRA_INSUMO" || existing.kind === "COMPRA_SERVICO") {
    return { error: "Compras não podem ser editadas — cancele e lance novamente." };
  }

  const identity = IdentitySchema.safeParse({
    description: formData.get("description"),
    category: formData.get("category"),
    supplierId: formData.get("supplierId") || undefined,
    competencia: formData.get("competencia"),
    notes: formData.get("notes") || undefined,
  });
  if (!identity.success) {
    return { error: identity.error.issues[0].message };
  }

  const hasPaid = existing.installments.some((i) => i.paid);
  const financialFieldsSent = formData.get("amount") !== null;

  if (hasPaid && financialFieldsSent) {
    return {
      error: "Já existe parcela paga — cancele esta conta e lance uma nova para alterar o valor.",
    };
  }

  if (!hasPaid && financialFieldsSent) {
    const financial = FinancialSchema.safeParse({
      amount: formData.get("amount"),
      paymentTerm: formData.get("paymentTerm"),
      installmentsCount: formData.get("installmentsCount") || 1,
      installmentIntervalDays: formData.get("installmentIntervalDays") || 30,
      issuedAt: formData.get("issuedAt"),
      firstDueDate: formData.get("firstDueDate") || undefined,
    });
    if (!financial.success) {
      return { error: financial.error.issues[0].message };
    }
    const data = financial.data;
    if (data.paymentTerm !== "AVISTA" && !data.firstDueDate) {
      return { error: "Informe a data de vencimento" };
    }

    const issuedAt = brazilDateFromLabel(data.issuedAt);
    const firstDueDate = data.firstDueDate ? brazilDateFromLabel(data.firstDueDate) : undefined;
    const installments = computeInstallments({
      paymentTerm: data.paymentTerm,
      amount: data.amount,
      installmentsCount: data.installmentsCount,
      intervalDays: data.installmentIntervalDays,
      firstDueDate,
      issuedAt,
    });

    await prisma.$transaction([
      prisma.expenseInstallment.deleteMany({ where: { expenseId } }),
      prisma.expense.update({
        where: { id: expenseId },
        data: {
          description: identity.data.description,
          category: identity.data.category,
          supplierId: identity.data.supplierId || null,
          competencia: brazilMonthStartFromLabel(identity.data.competencia),
          notes: identity.data.notes || null,
          amount: data.amount,
          paymentTerm: data.paymentTerm,
          installmentsCount: installments.length,
          installmentIntervalDays: data.installmentIntervalDays,
          issuedAt,
          installments: { create: installments },
        },
      }),
    ]);
  } else {
    await prisma.expense.update({
      where: { id: expenseId },
      data: {
        description: identity.data.description,
        category: identity.data.category,
        supplierId: identity.data.supplierId || null,
        competencia: brazilMonthStartFromLabel(identity.data.competencia),
        notes: identity.data.notes || null,
      },
    });
  }

  revalidatePath("/admin/custos/contas");
  revalidatePath(`/admin/custos/contas/${expenseId}`);
  revalidatePath("/admin/custos");
}

export async function duplicateExpenseToNextMonth(expenseId: string) {
  const session = await requireRole(["ADMIN"], "/admin/login");

  const original = await prisma.expense.findUniqueOrThrow({
    where: { id: expenseId },
    include: { installments: { orderBy: { number: "asc" } } },
  });
  if (original.kind !== "FIXA" && original.kind !== "VARIAVEL") {
    throw new Error("Só contas fixas/variáveis podem ser duplicadas.");
  }

  const nextIssuedAt = addCalendarMonthsBrazil(original.issuedAt, 1);
  const nextCompetencia = addCalendarMonthsBrazil(original.competencia ?? original.issuedAt, 1);
  const firstOriginalDue = original.installments[0]?.dueDate ?? original.issuedAt;
  const nextFirstDueDate = addCalendarMonthsBrazil(firstOriginalDue, 1);

  const installments = computeInstallments({
    paymentTerm: original.paymentTerm,
    amount: Number(original.amount),
    installmentsCount: original.installmentsCount,
    intervalDays: original.installmentIntervalDays,
    firstDueDate: nextFirstDueDate,
    issuedAt: nextIssuedAt,
  });

  const created = await prisma.expense.create({
    data: {
      kind: original.kind,
      description: original.description,
      category: original.category,
      supplierId: original.supplierId,
      amount: original.amount,
      paymentTerm: original.paymentTerm,
      installmentsCount: installments.length,
      installmentIntervalDays: original.installmentIntervalDays,
      issuedAt: nextIssuedAt,
      competencia: nextCompetencia,
      notes: original.notes,
      createdByUserId: session.userId,
      installments: { create: installments },
    },
  });

  revalidatePath("/admin/custos/contas");
  revalidatePath("/admin/custos");
  await flashSuccess("Conta duplicada para o próximo mês");
  redirect(`/admin/custos/contas/${created.id}`);
}

export async function toggleInstallmentPaid(installmentId: string, paid: boolean) {
  await requireRole(["ADMIN"], "/admin/login");

  const installment = await prisma.expenseInstallment.update({
    where: { id: installmentId },
    data: { paid, paidAt: paid ? new Date() : null },
    include: { expense: true },
  });

  const section = installment.expense.kind.startsWith("COMPRA") ? "compras" : "contas";
  revalidatePath(`/admin/custos/${section}/${installment.expenseId}`);
  revalidatePath(`/admin/custos/${section}`);
  revalidatePath("/admin/custos");
}

export async function cancelExpense(expenseId: string): Promise<{ error?: string } | void> {
  const session = await requireRole(["ADMIN"], "/admin/login");

  const expense = await prisma.expense.findUniqueOrThrow({
    where: { id: expenseId },
    include: { items: true },
  });
  if (expense.status === "CANCELADA") {
    return { error: "Essa conta/compra já está cancelada." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.expense.update({ where: { id: expenseId }, data: { status: "CANCELADA" } });

    if (expense.kind === "COMPRA_INSUMO") {
      for (const item of expense.items) {
        if (!item.insumoId) continue;
        await applyInsumoMovement(tx, item.insumoId, -Number(item.quantity), {
          reason: "estorno de compra",
          relatedExpenseId: expenseId,
          createdByUserId: session.userId,
        });
      }
    }
  });

  const section = expense.kind.startsWith("COMPRA") ? "compras" : "contas";
  revalidatePath(`/admin/custos/${section}`);
  revalidatePath(`/admin/custos/${section}/${expenseId}`);
  revalidatePath("/admin/custos");
  revalidatePath("/admin/insumos");
  revalidatePath("/admin/estoque");
}
