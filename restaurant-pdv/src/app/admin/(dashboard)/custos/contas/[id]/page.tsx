import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateExpense, toggleInstallmentPaid } from "@/app/actions/expenses";
import { BR_TIME_ZONE } from "@/lib/timezone";
import { ExpenseForm } from "../expense-form";
import { ToggleActiveButton } from "@/components/ui/toggle-active-button";
import { DuplicateButton } from "../duplicate-button";
import { CancelExpenseButton } from "../../cancel-expense-button";

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}
function toMonthInput(date: Date) {
  return date.toISOString().slice(0, 7);
}

export default async function EditarContaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: { installments: { orderBy: { number: "asc" } }, supplier: true },
  });
  if (!expense) notFound();
  if (expense.kind !== "FIXA" && expense.kind !== "VARIAVEL") notFound();

  const suppliers = await prisma.supplier.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  const boundUpdate = updateExpense.bind(null, expense.id);
  const locked = expense.installments.some((i) => i.paid);
  const firstDue = expense.installments[0]?.dueDate;

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl uppercase tracking-wide text-neutral-50">Editar conta</h1>
          {expense.status === "CANCELADA" && (
            <span className="rounded-md border border-red-900 px-2 py-1 text-xs text-red-400">
              Cancelada
            </span>
          )}
        </div>
        <ExpenseForm
          action={boundUpdate}
          submitLabel="Salvar alterações"
          isEdit
          locked={locked}
          suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
          initial={{
            kind: expense.kind,
            description: expense.description,
            category: expense.category,
            supplierId: expense.supplierId,
            amount: Number(expense.amount),
            paymentTerm: expense.paymentTerm,
            installmentsCount: expense.installmentsCount,
            installmentIntervalDays: expense.installmentIntervalDays,
            issuedAt: toDateInput(expense.issuedAt),
            firstDueDate: firstDue ? toDateInput(firstDue) : undefined,
            competencia: expense.competencia
              ? toMonthInput(expense.competencia)
              : toMonthInput(expense.issuedAt),
            notes: expense.notes,
          }}
        />
      </div>

      <div className="max-w-md space-y-3 border-t border-neutral-800 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-300">Parcelas</h2>
          <div className="flex gap-2">
            <DuplicateButton expenseId={expense.id} />
            {expense.status === "ATIVA" && <CancelExpenseButton expenseId={expense.id} />}
          </div>
        </div>
        <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800 text-sm">
          {expense.installments.map((inst) => (
            <div key={inst.id} className="flex items-center justify-between px-3 py-2">
              <div>
                <p>
                  Parcela {inst.number}/{expense.installmentsCount} · R${" "}
                  {Number(inst.amount).toFixed(2)}
                </p>
                <p className="text-xs text-neutral-500">
                  Vence {inst.dueDate.toLocaleDateString("pt-BR", { timeZone: BR_TIME_ZONE })}
                  {inst.paid &&
                    inst.paidAt &&
                    ` · pago em ${inst.paidAt.toLocaleDateString("pt-BR", { timeZone: BR_TIME_ZONE })}`}
                </p>
              </div>
              <ToggleActiveButton
                state={inst.paid}
                onToggle={toggleInstallmentPaid.bind(null, inst.id, !inst.paid)}
                onLabel="Marcar como paga"
                offLabel="Desfazer pagamento"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
