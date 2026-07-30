"use client";

import { useActionState, useState } from "react";
import { createPurchase } from "@/app/actions/purchases";

const PAYMENT_TERM_LABEL: Record<string, string> = {
  AVISTA: "À vista",
  PRAZO_UNICO: "A prazo (vencimento único)",
  PRAZO_PARCELADO: "A prazo (parcelado)",
};

type Row = {
  key: string;
  insumoId: string;
  description: string;
  quantity: string;
  unitCost: string;
};

function emptyRow(): Row {
  return { key: crypto.randomUUID(), insumoId: "", description: "", quantity: "1", unitCost: "" };
}

export function PurchaseForm({
  suppliers,
  insumos,
}: {
  suppliers: { id: string; name: string }[];
  insumos: { id: string; name: string; unit: string }[];
}) {
  const [state, formAction, pending] = useActionState(createPurchase, undefined);
  const [paymentTerm, setPaymentTerm] = useState("AVISTA");
  const [rows, setRows] = useState<Row[]>([emptyRow()]);

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  const total = rows.reduce(
    (sum, r) => sum + (Number(r.quantity) || 0) * (Number(r.unitCost) || 0),
    0
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-neutral-400" htmlFor="supplierId">
            Fornecedor (opcional)
          </label>
          <select
            id="supplierId"
            name="supplierId"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          >
            <option value="">Nenhum</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400" htmlFor="issuedAt">
            Data da compra
          </label>
          <input
            id="issuedAt"
            name="issuedAt"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-neutral-800 p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-300">Itens da compra</p>
          <button
            type="button"
            onClick={() => setRows((rs) => [...rs, emptyRow()])}
            className="text-xs text-neutral-400 underline underline-offset-2 hover:text-neutral-100"
          >
            + item
          </button>
        </div>

        {rows.map((row, idx) => (
          <div key={row.key} className="grid grid-cols-2 gap-2 sm:grid-cols-12">
            <div className="col-span-2 sm:col-span-3">
              <label className="mb-1 block text-xs text-neutral-400">Insumo</label>
              <select
                name={`items.${idx}.insumoId`}
                value={row.insumoId}
                onChange={(e) => {
                  const insumo = insumos.find((i) => i.id === e.target.value);
                  updateRow(row.key, {
                    insumoId: e.target.value,
                    description: row.description || insumo?.name || "",
                  });
                }}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-2 text-xs outline-none focus:border-neutral-400"
              >
                <option value="">Serviço/outro</option>
                {insumos.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.unit})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-4">
              <label className="mb-1 block text-xs text-neutral-400">Descrição</label>
              <input
                name={`items.${idx}.description`}
                value={row.description}
                onChange={(e) => updateRow(row.key, { description: e.target.value })}
                required
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-2 text-xs outline-none focus:border-neutral-400"
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="mb-1 block text-xs text-neutral-400">Qtd</label>
              <input
                name={`items.${idx}.quantity`}
                type="number"
                step="0.001"
                min="0"
                value={row.quantity}
                onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                required
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-2 text-xs outline-none focus:border-neutral-400"
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="mb-1 block text-xs text-neutral-400">Custo unit. (R$)</label>
              <input
                name={`items.${idx}.unitCost`}
                type="number"
                step="0.01"
                min="0"
                value={row.unitCost}
                onChange={(e) => updateRow(row.key, { unitCost: e.target.value })}
                required
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-2 text-xs outline-none focus:border-neutral-400"
              />
            </div>
            <div className="col-span-2 flex items-center justify-end sm:col-span-1">
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  remover
                </button>
              )}
            </div>
          </div>
        ))}
        <p className="text-right text-sm text-neutral-300">Total: R$ {total.toFixed(2)}</p>
      </div>

      <div className="space-y-3 rounded-lg border border-neutral-800 p-3">
        <div>
          <label className="mb-1 block text-xs text-neutral-400" htmlFor="paymentTerm">
            Forma de pagamento
          </label>
          <select
            id="paymentTerm"
            name="paymentTerm"
            defaultValue={paymentTerm}
            onChange={(e) => setPaymentTerm(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          >
            {Object.entries(PAYMENT_TERM_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {paymentTerm !== "AVISTA" && (
          <div>
            <label className="mb-1 block text-xs text-neutral-400" htmlFor="firstDueDate">
              Data de vencimento
            </label>
            <input
              id="firstDueDate"
              name="firstDueDate"
              type="date"
              required
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
          </div>
        )}

        {paymentTerm === "PRAZO_PARCELADO" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-neutral-400" htmlFor="installmentsCount">
                Nº de parcelas
              </label>
              <input
                id="installmentsCount"
                name="installmentsCount"
                type="number"
                min="2"
                defaultValue={2}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
              />
            </div>
            <div>
              <label
                className="mb-1 block text-xs text-neutral-400"
                htmlFor="installmentIntervalDays"
              >
                Intervalo (dias)
              </label>
              <input
                id="installmentIntervalDays"
                name="installmentIntervalDays"
                type="number"
                min="1"
                defaultValue={30}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs text-neutral-400" htmlFor="notes">
          Observações
        </label>
        <input
          id="notes"
          name="notes"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "Salvando…" : "Registrar compra"}
      </button>
    </form>
  );
}
