"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ConfirmCardButton({ action }: { action: () => Promise<void> }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        variant="success"
        size="lg"
        fullWidth
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              await action();
            } catch (e) {
              // redirect() lança um erro especial que precisa propagar para o
              // Next navegar — só tratamos como erro de fato se não for isso.
              unstable_rethrow(e);
              setError(e instanceof Error ? e.message : "Erro ao confirmar pagamento");
            }
          })
        }
      >
        {pending ? "Confirmando…" : "Terminal aprovou — confirmar pagamento"}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
