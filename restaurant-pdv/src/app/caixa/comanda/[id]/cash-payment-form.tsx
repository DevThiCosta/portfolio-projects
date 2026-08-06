"use client";

import { useActionState, useState } from "react";
import { closeComandaWithCash, type CashPaymentState } from "@/app/actions/payments";
import { TextField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

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
      <TextField
        label="Valor recebido (R$)"
        name="amountReceived"
        type="number"
        step="0.01"
        min="0"
        value={amountReceived}
        onChange={(e) => setAmountReceived(e.target.value)}
      />

      <p className="text-sm text-neutral-400">
        Troco:{" "}
        <span className={troco < 0 ? "text-red-400" : "text-emerald-400"}>
          R$ {troco.toFixed(2)}
        </span>
      </p>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <Button type="submit" variant="success" size="lg" fullWidth disabled={pending || troco < 0}>
        {pending ? "Fechando…" : "Confirmar pagamento em dinheiro"}
      </Button>
    </form>
  );
}
