"use client";

import { useTransition } from "react";
import { toggleInstallmentPaid } from "@/app/actions/expenses";

export function ToggleInstallmentButton({
  installmentId,
  paid,
}: {
  installmentId: string;
  paid: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => toggleInstallmentPaid(installmentId, !paid))}
      className={`shrink-0 rounded-md border px-2 py-1 text-xs disabled:opacity-50 ${
        paid
          ? "border-neutral-700 text-neutral-300 hover:bg-neutral-900"
          : "border-emerald-700 text-emerald-400 hover:bg-emerald-950"
      }`}
    >
      {paid ? "desfazer pagamento" : "marcar como paga"}
    </button>
  );
}
