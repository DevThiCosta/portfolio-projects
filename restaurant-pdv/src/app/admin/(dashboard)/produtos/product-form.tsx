"use client";

import { useActionState, useState } from "react";
import type { ProductFormState } from "@/app/actions/products";

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
      <Field label="Nome" name="name" defaultValue={initial?.name} required />
      <Field
        label="Categoria"
        name="category"
        defaultValue={initial?.category}
        required
        placeholder="Bebidas, Petiscos, Pratos…"
      />
      <Field
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
          className="h-4 w-4 rounded border-neutral-700 bg-neutral-950"
        />
        Controlar estoque deste produto
      </label>

      {trackStock && (
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Estoque atual"
            name="stock"
            type="number"
            min="0"
            defaultValue={initial?.stock ?? 0}
          />
          <Field
            label="Alerta de estoque baixo"
            name="lowStockThreshold"
            type="number"
            min="0"
            defaultValue={initial?.lowStockThreshold ?? 0}
          />
        </div>
      )}

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "Salvando…" : submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
  step,
  min,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
  placeholder?: string;
  step?: string;
  min?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-neutral-400" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        min={min}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
      />
    </div>
  );
}
