"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { readFlash } from "@/app/actions/flash";

export function Toaster() {
  const pathname = usePathname();
  const [message, setMessage] = useState<string | null>(null);

  // Verifica a cada navegação — o cookie é lido direto via server action,
  // sem depender do RSC da layout (que fica em cache no router do cliente
  // e não pegaria um cookie setado bem antes do redirect).
  useEffect(() => {
    let cancelled = false;
    readFlash().then((msg) => {
      if (!cancelled && msg) setMessage(msg);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timeout);
  }, [message]);

  if (!message) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="animate-toast-in pointer-events-auto flex items-center gap-2 rounded-lg border border-emerald-800 bg-neutral-900 px-4 py-2.5 text-sm shadow-lg">
        <svg viewBox="0 0 24 24" fill="none" className="size-4 shrink-0 text-emerald-400" aria-hidden="true">
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-neutral-50">{message}</span>
      </div>
    </div>
  );
}
