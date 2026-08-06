"use client";

import { useActionState } from "react";
import type { StaffFormState } from "@/app/actions/users";
import { TextField, SelectField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function NewStaffForm({
  action,
}: {
  action: (state: StaffFormState, formData: FormData) => Promise<StaffFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-lg border border-neutral-800 p-4"
    >
      <p className="text-sm font-medium">Novo garçom/caixa</p>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Nome" name="name" required />
        <SelectField label="Função" name="role">
          <option value="GARCOM">Garçom</option>
          <option value="CAIXA">Caixa</option>
        </SelectField>
      </div>
      <TextField
        label="PIN (4 dígitos)"
        name="pin"
        inputMode="numeric"
        pattern="\d{4}"
        maxLength={4}
        required
      />
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Criando…" : "Criar"}
      </Button>
    </form>
  );
}
