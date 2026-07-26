"use client";

import { useTransition } from "react";
import { reprintJob } from "@/app/actions/print-jobs";

export function ReprintButton({ jobId }: { jobId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => reprintJob(jobId))}
      className="shrink-0 rounded-md border border-amber-700 px-2 py-1 text-xs text-amber-300 hover:bg-amber-950 disabled:opacity-50"
    >
      {pending ? "Reenviando…" : "Reimprimir"}
    </button>
  );
}
