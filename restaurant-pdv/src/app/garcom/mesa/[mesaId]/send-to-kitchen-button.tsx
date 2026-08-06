"use client";

import { useTransition } from "react";

export function SendToKitchenButton({
  action,
  disabled,
  pendingCount,
}: {
  action: () => Promise<void>;
  disabled: boolean;
  pendingCount: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={disabled || pending}
      onClick={() => startTransition(action)}
      className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-medium text-white transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500 disabled:active:scale-100 hover:bg-emerald-500"
    >
      {pending
        ? "Enviando…"
        : disabled
          ? "Nenhum item pendente"
          : `Enviar ${pendingCount} ${pendingCount === 1 ? "item" : "itens"} para cozinha`}
    </button>
  );
}
