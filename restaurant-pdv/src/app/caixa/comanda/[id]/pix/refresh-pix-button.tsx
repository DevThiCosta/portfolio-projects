"use client";

import { useTransition } from "react";

export function RefreshPixButton({ action }: { action: () => Promise<void> }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(action)}
      className="w-full rounded-lg border border-neutral-700 py-2 text-sm text-neutral-300 hover:bg-neutral-900 disabled:opacity-50"
    >
      {pending ? "Verificando…" : "Verificar pagamento agora"}
    </button>
  );
}
