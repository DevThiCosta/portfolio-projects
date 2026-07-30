import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  BR_TIME_ZONE,
  addCalendarMonthsBrazil,
  brazilMonthStart,
  brazilMonthStartFromLabel,
} from "@/lib/timezone";

function toLabel(date: Date) {
  return date.toISOString().slice(0, 7);
}

export default async function ContasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const start = mes ? brazilMonthStartFromLabel(mes) : brazilMonthStart();
  const end = addCalendarMonthsBrazil(start, 1);
  const prevLabel = toLabel(addCalendarMonthsBrazil(start, -1));
  const nextLabel = toLabel(addCalendarMonthsBrazil(start, 1));

  const expenses = await prisma.expense.findMany({
    where: {
      kind: { in: ["FIXA", "VARIAVEL"] },
      status: "ATIVA",
      competencia: { gte: start, lt: end },
    },
    include: { supplier: true, installments: true },
    orderBy: { issuedAt: "desc" },
  });

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl uppercase tracking-wide text-neutral-50">Contas fixas e variáveis</h1>
        <Link
          href="/admin/custos/contas/nova"
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
        >
          + Nova conta
        </Link>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <Link
          href={`/admin/custos/contas?mes=${prevLabel}`}
          className="rounded-md border border-neutral-700 px-2 py-1 text-neutral-300 hover:bg-neutral-900"
        >
          ← mês anterior
        </Link>
        <span className="font-medium capitalize">
          {start.toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
            timeZone: BR_TIME_ZONE,
          })}
        </span>
        <Link
          href={`/admin/custos/contas?mes=${nextLabel}`}
          className="rounded-md border border-neutral-700 px-2 py-1 text-neutral-300 hover:bg-neutral-900"
        >
          próximo mês →
        </Link>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <p className="text-2xl font-semibold">R$ {total.toFixed(2)}</p>
        <p className="text-sm text-neutral-400">Total de contas neste mês</p>
      </div>

      <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
        {expenses.map((e) => {
          const paidCount = e.installments.filter((i) => i.paid).length;
          return (
            <Link
              key={e.id}
              href={`/admin/custos/contas/${e.id}`}
              className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-neutral-900"
            >
              <div>
                <p className="text-sm font-medium">{e.description}</p>
                <p className="text-xs text-neutral-500">
                  {e.category}
                  {e.supplier && ` · ${e.supplier.name}`} · parcelas {paidCount}/
                  {e.installments.length}
                </p>
              </div>
              <span className="text-sm font-medium">R$ {Number(e.amount).toFixed(2)}</span>
            </Link>
          );
        })}
        {expenses.length === 0 && (
          <p className="px-4 py-3 text-sm text-neutral-500">Nenhuma conta neste mês.</p>
        )}
      </div>
    </div>
  );
}
