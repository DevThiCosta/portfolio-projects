"use client";

import { useActionState } from "react";
import type { SupplierFormState } from "@/app/actions/suppliers";

const KIND_LABEL: Record<string, string> = {
  INSUMO: "Insumo",
  SERVICO: "Serviço",
  AMBOS: "Ambos",
};

export function SupplierForm({
  action,
  initial,
  submitLabel,
}: {
  action: (state: SupplierFormState, formData: FormData) => Promise<SupplierFormState>;
  initial?: {
    name: string;
    kind: string;
    document: string | null;
    contactName: string | null;
    phone: string | null;
    email: string | null;
    notes: string | null;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <Field label="Nome" name="name" defaultValue={initial?.name} required />

      <div>
        <label className="mb-1 block text-xs text-neutral-400" htmlFor="kind">
          Fornece
        </label>
        <select
          id="kind"
          name="kind"
          defaultValue={initial?.kind ?? "AMBOS"}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        >
          {Object.entries(KIND_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="CNPJ/CPF"
          name="document"
          defaultValue={initial?.document ?? undefined}
        />
        <Field
          label="Contato"
          name="contactName"
          defaultValue={initial?.contactName ?? undefined}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Telefone" name="phone" defaultValue={initial?.phone ?? undefined} />
        <Field
          label="E-mail"
          name="email"
          type="email"
          defaultValue={initial?.email ?? undefined}
        />
      </div>
      <Field label="Observações" name="notes" defaultValue={initial?.notes ?? undefined} />

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
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
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
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
      />
    </div>
  );
}
