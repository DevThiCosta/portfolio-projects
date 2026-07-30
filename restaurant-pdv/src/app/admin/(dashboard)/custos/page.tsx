import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BR_TIME_ZONE, addCalendarMonthsBrazil, brazilDayStart, brazilMonthStart } from "@/lib/timezone";

const KIND_LABEL: Record<string, string> = {
  FIXA: "Contas fixas",
  VARIAVEL: "Contas variáveis",
  COMPRA_INSUMO: "Compras de insumo",
  COMPRA_SERVICO: "Compras de serviço",
};

function sectionFor(kind: string) {
  return kind.startsWith("COMPRA") ? "compras" : "contas";
}

export default async function CustosResumoPage() {
  const monthStart = brazilMonthStart();
  const monthEnd = addCalendarMonthsBrazil(monthStart, 1);
  const today = brazilDayStart();
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [monthExpenses, upcoming, overdue] = await Promise.all([
    prisma.expense.findMany({
      where: {
        status: "ATIVA",
        OR: [
          { kind: { in: ["FIXA", "VARIAVEL"] }, competencia: { gte: monthStart, lt: monthEnd } },
          {
            kind: { in: ["COMPRA_INSUMO", "COMPRA_SERVICO"] },
            issuedAt: { gte: monthStart, lt: monthEnd },
          },
        ],
      },
    }),
    prisma.expenseInstallment.findMany({
      where: { paid: false, dueDate: { gte: today, lt: in7Days }, expense: { status: "ATIVA" } },
      include: { expense: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.expenseInstallment.findMany({
      where: { paid: false, dueDate: { lt: today }, expense: { status: "ATIVA" } },
      include: { expense: true },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  const total = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const byKind = monthExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.kind] = (acc[e.kind] ?? 0) + Number(e.amount);
    return acc;
  }, {});
  const byCategory = monthExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-2xl font-semibold">R$ {total.toFixed(2)}</p>
          <p className="text-sm text-neutral-400">Total de custos este mês</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="mb-1 text-sm font-medium text-neutral-300">Por tipo</p>
          {Object.entries(byKind).map(([kind, amount]) => (
            <div key={kind} className="flex justify-between text-sm">
              <span className="text-neutral-400">{KIND_LABEL[kind]}</span>
              <span>R$ {amount.toFixed(2)}</span>
            </div>
          ))}
          {Object.keys(byKind).length === 0 && (
            <p className="text-sm text-neutral-500">Sem lançamentos este mês.</p>
          )}
        </div>
      </div>

      {overdue.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-red-400">Parcelas atrasadas</p>
          <div className="divide-y divide-neutral-800 rounded-lg border border-red-900/50 text-sm">
            {overdue.map((inst) => (
              <Link
                key={inst.id}
                href={`/admin/custos/${sectionFor(inst.expense.kind)}/${inst.expenseId}`}
                className="flex items-center justify-between px-3 py-2 hover:bg-neutral-900"
              >
                <span>
                  {inst.expense.description} · parcela {inst.number}
                </span>
                <span className="text-red-400">
                  R$ {Number(inst.amount).toFixed(2)} · venceu{" "}
                  {inst.dueDate.toLocaleDateString("pt-BR", { timeZone: BR_TIME_ZONE })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-neutral-300">A vencer nos próximos 7 dias</p>
        <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800 text-sm">
          {upcoming.map((inst) => (
            <Link
              key={inst.id}
              href={`/admin/custos/${sectionFor(inst.expense.kind)}/${inst.expenseId}`}
              className="flex items-center justify-between px-3 py-2 hover:bg-neutral-900"
            >
              <span>
                {inst.expense.description} · parcela {inst.number}
              </span>
              <span className="text-neutral-400">
                R$ {Number(inst.amount).toFixed(2)} · vence{" "}
                {inst.dueDate.toLocaleDateString("pt-BR", { timeZone: BR_TIME_ZONE })}
              </span>
            </Link>
          ))}
          {upcoming.length === 0 && (
            <p className="px-3 py-2 text-neutral-500">
              Nenhuma parcela a vencer nos próximos 7 dias.
            </p>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-neutral-300">Por categoria (este mês)</p>
        <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800 text-sm">
          {Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount]) => (
              <div key={category} className="flex items-center justify-between px-3 py-2">
                <span>{category}</span>
                <span className="text-neutral-400">R$ {amount.toFixed(2)}</span>
              </div>
            ))}
          {Object.keys(byCategory).length === 0 && (
            <p className="px-3 py-2 text-neutral-500">Sem lançamentos este mês.</p>
          )}
        </div>
      </div>
    </div>
  );
}
