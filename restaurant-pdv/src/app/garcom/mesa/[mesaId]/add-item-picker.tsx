"use client";

import { useState, useTransition } from "react";
import { addItemToComanda } from "@/app/actions/comandas";

type ProductView = {
  id: string;
  name: string;
  category: string;
  price: number;
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
          <div className="space-y-2">
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
    <div className="rounded-lg border border-neutral-800 p-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm">{product.name}</p>
          <p className="text-xs text-neutral-500">R$ {product.price.toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="h-7 w-7 rounded-full bg-neutral-900 text-sm hover:bg-neutral-800"
          >
            −
          </button>
          <span className="w-4 text-center text-sm">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(50, q + 1))}
            className="h-7 w-7 rounded-full bg-neutral-900 text-sm hover:bg-neutral-800"
          >
            +
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={handleAdd}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-neutral-950 hover:bg-neutral-200 disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
      </div>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="observação (opcional)"
        className="mt-2 w-full rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs outline-none focus:border-neutral-600"
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
