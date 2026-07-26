"use client";

import { useTransition } from "react";
import { toggleProductActive } from "@/app/actions/products";

export function ToggleActiveButton({
  productId,
  active,
}: {
  productId: string;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(() => toggleProductActive(productId, !active))
      }
      className={`rounded-md border px-2 py-1 text-xs disabled:opacity-50 ${
        active
          ? "border-neutral-700 text-neutral-300 hover:bg-neutral-900"
          : "border-emerald-700 text-emerald-400 hover:bg-emerald-950"
      }`}
    >
      {active ? "desativar" : "ativar"}
    </button>
  );
}
