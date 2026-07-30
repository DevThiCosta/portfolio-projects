"use client";

import { useActionState } from "react";
import type { StockAdjustState } from "@/app/actions/stock";

export function AdjustStockForm({
  action,
  products,
}: {
  action: (state: StockAdjustState, formData: FormData) => Promise<StockAdjustState>;
  products: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-sm space-y-3 rounded-lg border border-neutral-800 p-4">
      <div>
        <label className="mb-1 block text-xs text-neutral-400" htmlFor="productId">
          Produto
        </label>
        <select
          id="productId"
          name="productId"
          required
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-neutral-400" htmlFor="delta">
          Quantidade (negativo para saída, ex: -5)
        </label>
        <input
          id="delta"
          name="delta"
          type="number"
          required
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-neutral-400" htmlFor="reason">
          Motivo
        </label>
        <input
          id="reason"
          name="reason"
          placeholder="reposição, perda, correção de contagem…"
          required
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "Salvando…" : "Registrar ajuste"}
      </button>
    </form>
  );
}
