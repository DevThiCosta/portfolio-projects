"use client";

import { useActionState } from "react";
import type { StaffFormState } from "@/app/actions/users";

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
        <div>
          <label className="mb-1 block text-xs text-neutral-400" htmlFor="name">
            Nome
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400" htmlFor="role">
            Função
          </label>
          <select
            id="role"
            name="role"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          >
            <option value="GARCOM">Garçom</option>
            <option value="CAIXA">Caixa</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-400" htmlFor="pin">
          PIN (4 dígitos)
        </label>
        <input
          id="pin"
          name="pin"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          required
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
      </div>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200 disabled:opacity-50"
      >
        {pending ? "Criando…" : "Criar"}
      </button>
    </form>
  );
}
