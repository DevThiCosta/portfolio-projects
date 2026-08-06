"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function RefreshPixButton({ action }: { action: () => Promise<void> }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button variant="secondary" fullWidth disabled={pending} onClick={() => startTransition(action)}>
      {pending ? "Verificando…" : "Verificar pagamento agora"}
    </Button>
  );
}
