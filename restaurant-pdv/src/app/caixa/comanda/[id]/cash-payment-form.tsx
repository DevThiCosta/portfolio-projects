"use client";

import { useActionState, useState } from "react";
import { closeComandaWithCash, type CashPaymentState } from "@/app/actions/payments";

export function CashPaymentForm({
  comandaId,
  total,
}: {
  comandaId: string;
  total: number;
}) {
  const [state, formAction, pending] = useActionState<CashPaymentState, FormData>(
    closeComandaWithCash,
    undefined
  );
  const [amountReceived, setAmountReceived] = useState(total.toFixed(2));

  const received = Number(amountReceived) || 0;
  const troco = received - total;

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="comandaId" value={comandaId} />
      <div>
        <label className="mb-1 block text-xs text-neutral-400" htmlFor="amountReceived">
          Valor recebido (R$)
        </label>
        <input
          id="amountReceived"
          name="amountReceived"
          type="number"
          step="0.01"
          min="0"
          value={amountReceived}
          onChange={(e) => setAmountReceived(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
      </div>

      <p className="text-sm text-neutral-400">
        Troco:{" "}
        <span className={troco < 0 ? "text-red-400" : "text-emerald-400"}>
          R$ {troco.toFixed(2)}
        </span>
      </p>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || troco < 0}
        className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
      >
        {pending ? "Fechando…" : "Confirmar pagamento em dinheiro"}
      </button>
    </form>
  );
}
