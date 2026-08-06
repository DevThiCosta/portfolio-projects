"use client";

import { useActionState, useState } from "react";
import { toggleUserActive, resetUserPin, type ResetPinState } from "@/app/actions/users";
import type { Role } from "@/generated/prisma/client";
import { ToggleActiveButton } from "@/components/ui/toggle-active-button";
import { Button } from "@/components/ui/button";

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
          <ToggleActiveButton state={active} onToggle={() => toggleUserActive(id, !active)} />
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
            className="w-40 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-50 outline-none transition-colors focus:border-accent"
          />
          <Button type="submit" size="sm" disabled={resetPending}>
            {resetPending ? "Salvando…" : "Salvar"}
          </Button>
          {state?.error && <span className="text-xs text-red-400">{state.error}</span>}
          {state?.success && <span className="text-xs text-emerald-400">PIN atualizado</span>}
        </form>
      )}
    </div>
  );
}
