"use client";

import { useActionState, useState } from "react";
import { createPurchase } from "@/app/actions/purchases";
import { TextField, SelectField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

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
        <SelectField label="Fornecedor (opcional)" name="supplierId">
          <option value="">Nenhum</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Data da compra"
          name="issuedAt"
          type="date"
          required
          defaultValue={new Date().toISOString().slice(0, 10)}
        />
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
              <SelectField
                label="Insumo"
                name={`items.${idx}.insumoId`}
                value={row.insumoId}
                onChange={(e) => {
                  const insumo = insumos.find((i) => i.id === e.target.value);
                  updateRow(row.key, {
                    insumoId: e.target.value,
                    description: row.description || insumo?.name || "",
                  });
                }}
                size="sm"
              >
                <option value="">Serviço/outro</option>
                {insumos.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.unit})
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="col-span-2 sm:col-span-4">
              <TextField
                label="Descrição"
                name={`items.${idx}.description`}
                value={row.description}
                onChange={(e) => updateRow(row.key, { description: e.target.value })}
                required
                size="sm"
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <TextField
                label="Qtd"
                name={`items.${idx}.quantity`}
                type="number"
                step="0.001"
                min="0"
                value={row.quantity}
                onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                required
                size="sm"
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <TextField
                label="Custo unit. (R$)"
                name={`items.${idx}.unitCost`}
                type="number"
                step="0.01"
                min="0"
                value={row.unitCost}
                onChange={(e) => updateRow(row.key, { unitCost: e.target.value })}
                required
                size="sm"
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
        <SelectField
          label="Forma de pagamento"
          name="paymentTerm"
          defaultValue={paymentTerm}
          onChange={(e) => setPaymentTerm(e.target.value)}
        >
          {Object.entries(PAYMENT_TERM_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>

        {paymentTerm !== "AVISTA" && (
          <TextField label="Data de vencimento" name="firstDueDate" type="date" required />
        )}

        {paymentTerm === "PRAZO_PARCELADO" && (
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Nº de parcelas"
              name="installmentsCount"
              type="number"
              min="2"
              defaultValue={2}
            />
            <TextField
              label="Intervalo (dias)"
              name="installmentIntervalDays"
              type="number"
              min="1"
              defaultValue={30}
            />
          </div>
        )}
      </div>

      <TextField label="Observações" name="notes" />

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Registrar compra"}
      </Button>
    </form>
  );
}
