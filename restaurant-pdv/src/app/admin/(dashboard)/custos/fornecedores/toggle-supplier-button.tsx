"use client";

import { useTransition } from "react";
import { toggleSupplierActive } from "@/app/actions/suppliers";

export function ToggleSupplierButton({
  supplierId,
  active,
}: {
  supplierId: string;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => toggleSupplierActive(supplierId, !active))}
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
