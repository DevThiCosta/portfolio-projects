import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { brazilDayStart, brazilWeekStart, brazilMonthStart } from "@/lib/timezone";

type Range = "hoje" | "semana" | "mes";

// O servidor roda em UTC (hospedagem na nuvem), mas o bar é no Brasil — usar
// hora local do processo faria "hoje" virar às 21h de Brasília, bem no meio
// do movimento. brazilDayStart/etc. sempre calculam em horário de Brasília,
// independente do fuso do servidor.
function rangeStart(range: Range): Date {
  if (range === "hoje") return brazilDayStart();
  if (range === "semana") return brazilWeekStart();
  return brazilMonthStart();
}

const RANGE_LABEL: Record<Range, string> = {
  hoje: "Hoje",
  semana: "Esta semana",
  mes: "Este mês",
};

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rawRange } = await searchParams;
  const range: Range =
    rawRange === "semana" || rawRange === "mes" ? rawRange : "hoje";
  const since = rangeStart(range);

  const payments = await prisma.payment.findMany({
    where: { status: "CONFIRMED", confirmedAt: { gte: since } },
  });

  const totalSales = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const byMethod = payments.reduce<Record<string, number>>((acc, p) => {
    acc[p.method] = (acc[p.method] ?? 0) + Number(p.amount);
    return acc;
  }, {});

  const closedComandas = await prisma.comanda.findMany({
    where: { status: "CLOSED", closedAt: { gte: since } },
    include: { items: { where: { status: { not: "CANCELLED" } }, include: { product: true } } },
  });

  const productTotals = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const comanda of closedComandas) {
    for (const item of comanda.items) {
      const entry = productTotals.get(item.productId) ?? {
        name: item.product.name,
        qty: 0,
        revenue: 0,
      };
      entry.qty += item.quantity;
      entry.revenue += Number(item.unitPriceAtOrder) * item.quantity;
      productTotals.set(item.productId, entry);
    }
  }
  const topProducts = [...productTotals.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const trackedProducts = await prisma.product.findMany({
    where: { active: true, stock: { not: null }, lowStockThreshold: { not: null } },
    select: { id: true, name: true, stock: true, lowStockThreshold: true },
  });
  const lowStock = trackedProducts.filter(
    (p) => (p.stock ?? 0) <= (p.lowStockThreshold ?? 0)
  );

  const METHOD_LABEL: Record<string, string> = {
    DINHEIRO: "Dinheiro",
    PIX: "Pix",
    CARTAO_TERMINAL: "Cartão",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl uppercase tracking-wide text-neutral-50">Relatórios</h1>
        <div className="flex gap-2 text-sm">
          {(["hoje", "semana", "mes"] as Range[]).map((r) => (
            <Link
              key={r}
              href={`/admin/relatorios?range=${r}`}
              className={`rounded-md border px-2 py-1 ${
                r === range
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-neutral-700 text-neutral-300 hover:bg-neutral-900"
              }`}
            >
              {RANGE_LABEL[r]}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-2xl font-semibold">R$ {totalSales.toFixed(2)}</p>
          <p className="text-sm text-neutral-400">Total vendido — {RANGE_LABEL[range]}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="mb-1 text-sm font-medium text-neutral-300">Por forma de pagamento</p>
          {Object.keys(byMethod).length === 0 && (
            <p className="text-sm text-neutral-500">Sem pagamentos no período.</p>
          )}
          {Object.entries(byMethod).map(([method, amount]) => (
            <div key={method} className="flex justify-between text-sm">
              <span className="text-neutral-400">{METHOD_LABEL[method] ?? method}</span>
              <span>R$ {amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-neutral-300">Produtos mais vendidos</p>
        <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
          {topProducts.map((p) => (
            <div key={p.name} className="flex items-center justify-between px-3 py-2 text-sm">
              <span>{p.name}</span>
              <span className="text-neutral-400">
                {p.qty} un · R$ {p.revenue.toFixed(2)}
              </span>
            </div>
          ))}
          {topProducts.length === 0 && (
            <p className="px-3 py-2 text-sm text-neutral-500">Sem vendas no período.</p>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-neutral-300">Estoque baixo</p>
        <div className="divide-y divide-neutral-800 rounded-lg border border-amber-900/50">
          {lowStock.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span>{p.name}</span>
              <span className="text-amber-400">
                {p.stock} (mín. {p.lowStockThreshold})
              </span>
            </div>
          ))}
          {lowStock.length === 0 && (
            <p className="px-3 py-2 text-sm text-neutral-500">Nenhum produto com estoque baixo.</p>
          )}
        </div>
      </div>
    </div>
  );
}
