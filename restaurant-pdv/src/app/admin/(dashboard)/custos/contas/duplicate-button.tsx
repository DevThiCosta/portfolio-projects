"use client";

import { useTransition } from "react";
import { duplicateExpenseToNextMonth } from "@/app/actions/expenses";
import { Button } from "@/components/ui/button";

export function DuplicateButton({ expenseId }: { expenseId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => duplicateExpenseToNextMonth(expenseId))}
    >
      {pending ? "Duplicando…" : "Duplicar para o próximo mês"}
    </Button>
  );
}
