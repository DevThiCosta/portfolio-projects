"use client";

import { useActionState } from "react";
import type { InsumoFormState } from "@/app/actions/insumos";

export function NewInsumoForm({
  action,
}: {
  action: (state: InsumoFormState, formData: FormData) => Promise<InsumoFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-neutral-800 p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-neutral-400" htmlFor="name">
            Nome
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Cachaça, limão, batata…"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400" htmlFor="unit">
            Unidade
          </label>
          <input
            id="unit"
            name="unit"
            required
            placeholder="ml, g, un…"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-neutral-400" htmlFor="stock">
            Estoque inicial
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            step="0.001"
            min="0"
            defaultValue={0}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400" htmlFor="lowStockThreshold">
            Alerta de estoque baixo
          </label>
          <input
            id="lowStockThreshold"
            name="lowStockThreshold"
            type="number"
            step="0.001"
            min="0"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
        </div>
      </div>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "Criando…" : "Criar insumo"}
      </button>
    </form>
  );
}
