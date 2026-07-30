"use client";

import { useState, useTransition } from "react";
import { addItemToComanda } from "@/app/actions/comandas";

type ProductView = {
  id: string;
  name: string;
  category: string;
  price: number;
  /** null = venda livre, sem limite rastreado */
  available: number | null;
};

export function AddItemPicker({
  comandaId,
  products,
}: {
  comandaId: string;
  products: ProductView[];
}) {
  const byCategory = new Map<string, ProductView[]>();
  for (const p of products) {
    const list = byCategory.get(p.category) ?? [];
    list.push(p);
    byCategory.set(p.category, list);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-neutral-300">Adicionar item</h2>
      {[...byCategory.entries()].map(([category, items]) => (
        <div key={category}>
          <p className="mb-2 text-xs text-neutral-500">{category}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map((p) => (
              <ProductRow key={p.id} comandaId={comandaId} product={p} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductRow({
  comandaId,
  product,
}: {
  comandaId: string;
  product: ProductView;
}) {
  const outOfStock = product.available !== null && product.available <= 0;
  const maxQty = product.available !== null ? Math.min(50, product.available) : 50;

  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    const fd = new FormData();
    fd.set("comandaId", comandaId);
    fd.set("productId", product.id);
    fd.set("quantity", String(qty));
    if (notes.trim()) fd.set("notes", notes.trim());
    startTransition(async () => {
      setError(null);
      try {
        await addItemToComanda(fd);
        setQty(1);
        setNotes("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não consegui adicionar o item");
      }
    });
  }

  return (
    <div
      className={`rounded-lg border p-3 ${
        outOfStock ? "border-neutral-900 bg-neutral-950/50 opacity-60" : "border-neutral-800"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm">{product.name}</p>
          <p className="text-xs text-neutral-500">
            R$ {product.price.toFixed(2)}
            {product.available !== null && !outOfStock && ` · restam ${product.available}`}
          </p>
        </div>
      </div>

      {outOfStock ? (
        <p className="mt-2 text-xs font-medium text-red-400">Esgotado</p>
      ) : (
        <>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-lg hover:bg-neutral-800 active:scale-95"
              >
                −
              </button>
              <span className="w-6 text-center text-sm">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                disabled={qty >= maxQty}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-lg hover:bg-neutral-800 active:scale-95 disabled:opacity-40"
              >
                +
              </button>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={handleAdd}
              className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
            >
              Adicionar
            </button>
          </div>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="observação (opcional)"
            className="mt-2 w-full rounded-md border border-neutral-800 bg-neutral-950 px-2 py-2 text-sm outline-none focus:border-neutral-600"
          />
        </>
      )}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
