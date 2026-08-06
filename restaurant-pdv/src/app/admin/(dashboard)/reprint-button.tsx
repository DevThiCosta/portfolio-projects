"use client";

import { useTransition } from "react";
import { reprintJob } from "@/app/actions/print-jobs";
import { Button } from "@/components/ui/button";

export function ReprintButton({ jobId }: { jobId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="warn"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => reprintJob(jobId))}
    >
      {pending ? "Reenviando…" : "Reimprimir"}
    </Button>
  );
}
