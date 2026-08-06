"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function GeneratePixButton({ action }: { action: () => Promise<void> }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        variant="success"
        fullWidth
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
      >
        {pending ? "Gerando…" : "Gerar cobrança Pix"}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
