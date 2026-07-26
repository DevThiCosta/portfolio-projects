"use client";

import { useState, useTransition } from "react";
import { cancelPendingItem } from "@/app/actions/comandas";

type ComandaItemView = {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  status: "PENDING" | "SENT_TO_KITCHEN" | "PREPARING" | "DELIVERED" | "CANCELLED";
};

const STATUS_LABEL: Record<ComandaItemView["status"], string> = {
  PENDING: "pendente",
  SENT_TO_KITCHEN: "enviado à cozinha",
  PREPARING: "preparando",
  DELIVERED: "entregue",
  CANCELLED: "cancelado",
};

export function ComandaItemsList({ items }: { items: ComandaItemView[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="text-sm text-neutral-500">Nenhum item ainda.</p>;
  }

  function handleCancel(itemId: string) {
    startTransition(async () => {
      setError(null);
      try {
        await cancelPendingItem(itemId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não consegui cancelar o item");
      }
    });
  }

  return (
    <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
      {error && (
        <p className="px-3 py-2 text-xs text-red-400">{error}</p>
      )}
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between px-3 py-2">
          <div>
            <p className="text-sm">
              {item.quantity}x {item.productName}
            </p>
            {item.notes && (
              <p className="text-xs text-neutral-500">obs: {item.notes}</p>
            )}
            <p
              className={`text-xs ${
                item.status === "PENDING" ? "text-amber-400" : "text-neutral-500"
              }`}
            >
              {STATUS_LABEL[item.status]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-400">
              R$ {(item.unitPrice * item.quantity).toFixed(2)}
            </span>
            {item.status === "PENDING" && (
              <button
                disabled={pending}
                onClick={() => handleCancel(item.id)}
                className="text-xs text-red-400 underline underline-offset-2 disabled:opacity-50"
              >
                cancelar
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
