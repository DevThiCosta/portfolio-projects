"use client";

import { useState, useTransition } from "react";
import { cancelExpense } from "@/app/actions/expenses";
import { Button } from "@/components/ui/button";

export function CancelExpenseButton({ expenseId }: { expenseId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <Button
        variant="danger"
        size="sm"
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
      >
        {pending ? "Cancelando…" : "Cancelar"}
      </Button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
