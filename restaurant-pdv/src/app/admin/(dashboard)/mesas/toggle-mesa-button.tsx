"use client";

import { useState, useTransition } from "react";
import { toggleMesaActive } from "@/app/actions/mesas";

export function ToggleMesaButton({
  mesaId,
  active,
}: {
  mesaId: string;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              await toggleMesaActive(mesaId, !active);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Erro ao atualizar mesa");
            }
          })
        }
        className="w-full rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-900 disabled:opacity-50"
      >
        {active ? "desativar" : "ativar"}
      </button>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
