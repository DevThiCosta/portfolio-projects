import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ToggleActiveButton } from "./toggle-active-button";

export default async function ProdutosPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const byCategory = new Map<string, typeof products>();
  for (const p of products) {
    const list = byCategory.get(p.category) ?? [];
    list.push(p);
    byCategory.set(p.category, list);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl uppercase tracking-wide text-neutral-50">Produtos</h1>
        <Link
          href="/admin/produtos/novo"
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
        >
          + Novo produto
        </Link>
      </div>

      {products.length === 0 && (
        <p className="text-sm text-neutral-500">Nenhum produto cadastrado.</p>
      )}

      {[...byCategory.entries()].map(([category, items]) => (
        <div key={category}>
          <h2 className="mb-2 text-sm font-medium text-neutral-400">
            {category}
          </h2>
          <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {items.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p
                    className={`text-sm font-medium ${!p.active ? "text-neutral-500 line-through" : ""}`}
                  >
                    {p.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    R$ {Number(p.price).toFixed(2)}
                    {p.stock !== null && ` · estoque: ${p.stock}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/produtos/${p.id}`}
                    className="text-xs text-neutral-400 underline underline-offset-2 hover:text-neutral-100"
                  >
                    editar
                  </Link>
                  <ToggleActiveButton productId={p.id} active={p.active} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
