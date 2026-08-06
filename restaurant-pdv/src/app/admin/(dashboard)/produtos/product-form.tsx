"use client";

import { useActionState, useState } from "react";
import type { ProductFormState } from "@/app/actions/products";
import { TextField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function ProductForm({
  action,
  initial,
  submitLabel,
}: {
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  initial?: {
    name: string;
    category: string;
    price: number;
    stock: number | null;
    lowStockThreshold: number | null;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [trackStock, setTrackStock] = useState(initial?.stock !== null && initial?.stock !== undefined);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <TextField label="Nome" name="name" defaultValue={initial?.name} required />
      <TextField
        label="Categoria"
        name="category"
        defaultValue={initial?.category}
        required
        placeholder="Bebidas, Petiscos, Pratos…"
      />
      <TextField
        label="Preço (R$)"
        name="price"
        type="number"
        step="0.01"
        min="0"
        defaultValue={initial?.price}
        required
      />

      <label className="flex items-center gap-2 text-sm text-neutral-300">
        <input
          type="checkbox"
          name="trackStock"
          defaultChecked={trackStock}
          onChange={(e) => setTrackStock(e.target.checked)}
          className="h-4 w-4 rounded border-neutral-700 bg-neutral-950 text-accent focus:ring-accent"
        />
        Controlar estoque deste produto
      </label>

      {trackStock && (
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Estoque atual"
            name="stock"
            type="number"
            min="0"
            defaultValue={initial?.stock ?? 0}
          />
          <TextField
            label="Alerta de estoque baixo"
            name="lowStockThreshold"
            type="number"
            min="0"
            defaultValue={initial?.lowStockThreshold ?? 0}
          />
        </div>
      )}

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
