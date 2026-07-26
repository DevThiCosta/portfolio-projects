"use client";

import { useState, useTransition } from "react";

export function GeneratePixButton({ action }: { action: () => Promise<void> }) {
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
              setError(e instanceof Error ? e.message : "Erro ao gerar cobrança Pix");
            }
          })
        }
        className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Gerando…" : "Gerar cobrança Pix"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
