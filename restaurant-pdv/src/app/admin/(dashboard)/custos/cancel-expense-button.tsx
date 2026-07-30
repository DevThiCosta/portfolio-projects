"use client";

import { useState, useTransition } from "react";
import { cancelExpense } from "@/app/actions/expenses";

export function CancelExpenseButton({ expenseId }: { expenseId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <button
        disabled={pending}
        onClick={() => {
          if (!confirm("Cancelar este lançamento? Se for uma compra de insumo, o estoque será estornado.")) {
            return;
          }
          startTransition(async () => {
            const result = await cancelExpense(expenseId);
            setError(result?.error ?? null);
          });
        }}
        className="rounded-md border border-red-900 px-3 py-1.5 text-xs text-red-400 hover:bg-red-950 disabled:opacity-50"
      >
        {pending ? "Cancelando…" : "Cancelar"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
