"use client";

import { useTransition } from "react";
import { toggleInsumoActive } from "@/app/actions/insumos";

export function ToggleInsumoButton({
  insumoId,
  active,
}: {
  insumoId: string;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => toggleInsumoActive(insumoId, !active))}
      className={`shrink-0 rounded-md border px-2 py-1 text-xs disabled:opacity-50 ${
        active
          ? "border-neutral-700 text-neutral-300 hover:bg-neutral-900"
          : "border-emerald-700 text-emerald-400 hover:bg-emerald-950"
      }`}
    >
      {active ? "desativar" : "ativar"}
    </button>
  );
}
