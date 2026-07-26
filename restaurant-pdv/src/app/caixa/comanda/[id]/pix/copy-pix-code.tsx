"use client";

import { useState } from "react";

export function CopyPixCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="w-full truncate rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-left text-xs text-neutral-400 hover:border-neutral-500"
    >
      {copied ? "Copiado!" : `Copiar código Pix (copia e cola): ${code}`}
    </button>
  );
}
