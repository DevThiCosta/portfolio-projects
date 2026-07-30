"use client";

import { useTransition } from "react";
import { duplicateExpenseToNextMonth } from "@/app/actions/expenses";

export function DuplicateButton({ expenseId }: { expenseId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => duplicateExpenseToNextMonth(expenseId))}
      className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-900 disabled:opacity-50"
    >
      {pending ? "Duplicando…" : "Duplicar para o próximo mês"}
    </button>
  );
}
