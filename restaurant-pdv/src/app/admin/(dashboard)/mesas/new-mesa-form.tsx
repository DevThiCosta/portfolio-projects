"use client";

import { useActionState } from "react";
import type { MesaFormState } from "@/app/actions/mesas";
import { TextField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function NewMesaForm({
  action,
}: {
  action: (state: MesaFormState, formData: FormData) => Promise<MesaFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex items-end gap-2">
      <TextField
        label='Nova mesa (ex: "Mesa 31" ou "Área Externa 1")'
        name="label"
        required
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Adicionando…" : "Adicionar"}
      </Button>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
