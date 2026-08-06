"use client";

import { useActionState } from "react";
import type { SupplierFormState } from "@/app/actions/suppliers";
import { TextField, SelectField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

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
      <TextField label="Nome" name="name" defaultValue={initial?.name} required />

      <SelectField label="Fornece" name="kind" defaultValue={initial?.kind ?? "AMBOS"}>
        {Object.entries(KIND_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectField>

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="CNPJ/CPF"
          name="document"
          defaultValue={initial?.document ?? undefined}
        />
        <TextField
          label="Contato"
          name="contactName"
          defaultValue={initial?.contactName ?? undefined}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Telefone" name="phone" defaultValue={initial?.phone ?? undefined} />
        <TextField
          label="E-mail"
          name="email"
          type="email"
          defaultValue={initial?.email ?? undefined}
        />
      </div>
      <TextField label="Observações" name="notes" defaultValue={initial?.notes ?? undefined} />

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
