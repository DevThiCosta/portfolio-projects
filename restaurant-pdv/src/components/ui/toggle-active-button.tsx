"use client";

import { useState, useTransition } from "react";

export function ToggleActiveButton({
  state,
  onToggle,
  onLabel = "Ativar",
  offLabel = "Desativar",
  className = "",
}: {
  state: boolean;
  onToggle: () => Promise<void>;
  onLabel?: string;
  offLabel?: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={className.includes("w-full") ? "w-full" : undefined}>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              await onToggle();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Não consegui atualizar.");
            }
          })
        }
        className={`shrink-0 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
          state
            ? "border-neutral-700 text-neutral-300 hover:bg-neutral-900"
            : "border-emerald-700 text-emerald-400 hover:bg-emerald-950"
        } ${className}`}
      >
        {state ? offLabel : onLabel}
      </button>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
