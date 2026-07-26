"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";

export function ConfirmCardButton({ action }: { action: () => Promise<void> }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <button
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
        className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Confirmando…" : "Terminal aprovou — confirmar pagamento"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
