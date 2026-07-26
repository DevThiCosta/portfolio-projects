import { prisma } from "@/lib/prisma";
import { adjustStock } from "@/app/actions/stock";
import { AdjustStockForm } from "./adjust-stock-form";

export default async function EstoquePage() {
  const products = await prisma.product.findMany({
    where: { stock: { not: null } },
    orderBy: { name: "asc" },
  });

  const recentMovements = await prisma.stockMovement.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
    include: { product: true, createdBy: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Estoque</h1>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <p className="text-sm font-medium text-neutral-300">
            Produtos com estoque controlado
          </p>
          <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {products.map((p) => {
              const low =
                p.lowStockThreshold !== null && (p.stock ?? 0) <= p.lowStockThreshold;
              return (
                <div key={p.id} className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm">{p.name}</span>
                  <span
                    className={`text-sm font-medium ${low ? "text-amber-400" : "text-neutral-300"}`}
                  >
                    {p.stock} {low && "⚠"}
                  </span>
                </div>
              );
            })}
            {products.length === 0 && (
              <p className="px-3 py-2 text-sm text-neutral-500">
                Nenhum produto com estoque controlado. Ative em Produtos.
              </p>
            )}
          </div>

          <p className="text-sm font-medium text-neutral-300">Últimas movimentações</p>
          <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800 text-sm">
            {recentMovements.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-3 py-2">
                <div>
                  <p>{m.product.name}</p>
                  <p className="text-xs text-neutral-500">
                    {m.reason} · {m.createdBy?.name ?? "sistema"} ·{" "}
                    {m.createdAt.toLocaleString("pt-BR")}
                  </p>
                </div>
                <span className={m.delta < 0 ? "text-red-400" : "text-emerald-400"}>
                  {m.delta > 0 ? "+" : ""}
                  {m.delta}
                </span>
              </div>
            ))}
            {recentMovements.length === 0 && (
              <p className="px-3 py-2 text-neutral-500">Nenhuma movimentação ainda.</p>
            )}
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-neutral-300">
            Ajuste manual (reposição, perda, correção)
          </p>
          <AdjustStockForm action={adjustStock} products={products.map((p) => ({ id: p.id, name: p.name }))} />
        </div>
      </div>
    </div>
  );
}
