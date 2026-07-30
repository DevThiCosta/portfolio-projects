"use client";

import { useActionState } from "react";
import type { InsumoAdjustState } from "@/app/actions/insumos";

export function AdjustInsumoForm({
  action,
  insumos,
}: {
  action: (state: InsumoAdjustState, formData: FormData) => Promise<InsumoAdjustState>;
  insumos: { id: string; name: string; unit: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-neutral-800 p-4">
      <div>
        <label className="mb-1 block text-xs text-neutral-400" htmlFor="insumoId">
          Insumo
        </label>
        <select
          id="insumoId"
          name="insumoId"
          required
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        >
          {insumos.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name} ({i.unit})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400" htmlFor="delta">
          Quantidade (negativo para saída)
        </label>
        <input
          id="delta"
          name="delta"
          type="number"
          step="0.001"
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
          placeholder="reposição, perda, correção…"
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
