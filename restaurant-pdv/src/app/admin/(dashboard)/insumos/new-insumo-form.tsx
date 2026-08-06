"use client";

import { useActionState } from "react";
import type { InsumoFormState } from "@/app/actions/insumos";
import { TextField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function NewInsumoForm({
  action,
}: {
  action: (state: InsumoFormState, formData: FormData) => Promise<InsumoFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-neutral-800 p-4">
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Nome" name="name" required placeholder="Cachaça, limão, batata…" />
        <TextField label="Unidade" name="unit" required placeholder="ml, g, un…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Estoque inicial"
          name="stock"
          type="number"
          step="0.001"
          min="0"
          defaultValue={0}
        />
        <TextField
          label="Alerta de estoque baixo"
          name="lowStockThreshold"
          type="number"
          step="0.001"
          min="0"
        />
      </div>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Criando…" : "Criar insumo"}
      </Button>
    </form>
  );
}
