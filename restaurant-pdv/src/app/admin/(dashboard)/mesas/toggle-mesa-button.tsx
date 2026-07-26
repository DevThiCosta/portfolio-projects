"use client";

import { useTransition } from "react";
import { toggleMesaActive } from "@/app/actions/mesas";

export function ToggleMesaButton({
  mesaId,
  active,
}: {
  mesaId: string;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => toggleMesaActive(mesaId, !active))}
      className="w-full rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-900 disabled:opacity-50"
    >
      {active ? "desativar" : "ativar"}
    </button>
  );
}
