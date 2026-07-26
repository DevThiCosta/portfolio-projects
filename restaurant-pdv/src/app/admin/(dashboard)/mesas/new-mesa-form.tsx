"use client";

import { useActionState } from "react";
import type { MesaFormState } from "@/app/actions/mesas";

export function NewMesaForm({
  action,
}: {
  action: (state: MesaFormState, formData: FormData) => Promise<MesaFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex items-end gap-2">
      <div>
        <label className="mb-1 block text-xs text-neutral-400" htmlFor="label">
          Nova mesa (ex: &quot;Mesa 31&quot; ou &quot;Área Externa 1&quot;)
        </label>
        <input
          id="label"
          name="label"
          required
          className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200 disabled:opacity-50"
      >
        Adicionar
      </button>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
