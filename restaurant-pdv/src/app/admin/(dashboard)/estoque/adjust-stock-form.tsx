"use client";

import { useActionState } from "react";
import type { StockAdjustState } from "@/app/actions/stock";
import { TextField, SelectField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

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
      <SelectField label="Produto" name="productId" required>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </SelectField>

      <TextField
        label="Quantidade (negativo para saída, ex: -5)"
        name="delta"
        type="number"
        required
      />

      <TextField
        label="Motivo"
        name="reason"
        placeholder="reposição, perda, correção de contagem…"
        required
      />

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Registrar ajuste"}
      </Button>
    </form>
  );
}
