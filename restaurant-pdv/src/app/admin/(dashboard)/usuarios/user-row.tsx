"use client";

import { useActionState, useState, useTransition } from "react";
import { toggleUserActive, resetUserPin, type ResetPinState } from "@/app/actions/users";
import type { Role } from "@/generated/prisma/client";

export function UserRow({
  id,
  name,
  role,
  active,
}: {
  id: string;
  name: string;
  role: Role;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [showReset, setShowReset] = useState(false);
  const resetAction = resetUserPin.bind(null, id);
  const [state, formAction, resetPending] = useActionState<ResetPinState, FormData>(
    resetAction,
    undefined
  );

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${!active ? "text-neutral-500 line-through" : ""}`}>
            {name}
          </p>
          <p className="text-xs text-neutral-500">
            {role === "GARCOM" ? "Garçom" : "Caixa"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowReset((v) => !v)}
            className="text-xs text-neutral-400 underline underline-offset-2 hover:text-neutral-100"
          >
            resetar PIN
          </button>
          <button
            disabled={pending}
            onClick={() => startTransition(() => toggleUserActive(id, !active))}
            className={`rounded-md border px-2 py-1 text-xs disabled:opacity-50 ${
              active
                ? "border-neutral-700 text-neutral-300 hover:bg-neutral-900"
                : "border-emerald-700 text-emerald-400 hover:bg-emerald-950"
            }`}
          >
            {active ? "desativar" : "ativar"}
          </button>
        </div>
      </div>

      {showReset && (
        <form action={formAction} className="mt-2 flex items-center gap-2">
          <input
            name="pin"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            placeholder="Novo PIN (4 dígitos)"
            required
            className="w-40 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm outline-none focus:border-neutral-400"
          />
          <button
            type="submit"
            disabled={resetPending}
            className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-neutral-950 hover:bg-neutral-200 disabled:opacity-50"
          >
            Salvar
          </button>
          {state?.error && <span className="text-xs text-red-400">{state.error}</span>}
          {state?.success && <span className="text-xs text-emerald-400">PIN atualizado</span>}
        </form>
      )}
    </div>
  );
}
