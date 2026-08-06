"use client";

import { useActionState } from "react";
import type { InsumoAdjustState } from "@/app/actions/insumos";
import { TextField, SelectField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

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
      <SelectField label="Insumo" name="insumoId" required>
        {insumos.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name} ({i.unit})
          </option>
        ))}
      </SelectField>
      <TextField
        label="Quantidade (negativo para saída)"
        name="delta"
        type="number"
        step="0.001"
        required
      />
      <TextField
        label="Motivo"
        name="reason"
        placeholder="reposição, perda, correção…"
        required
      />
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Registrar ajuste"}
      </Button>
    </form>
  );
}
