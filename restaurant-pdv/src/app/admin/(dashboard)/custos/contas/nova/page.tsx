import { prisma } from "@/lib/prisma";
import { createExpense } from "@/app/actions/expenses";
import { ExpenseForm } from "../expense-form";

export default async function NovaContaPage() {
  const suppliers = await prisma.supplier.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl uppercase tracking-wide text-neutral-50">Nova conta</h1>
      <ExpenseForm
        action={createExpense}
        submitLabel="Criar conta"
        suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}
