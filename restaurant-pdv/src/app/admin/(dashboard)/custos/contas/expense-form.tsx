"use client";

import { useActionState, useState } from "react";
import type { ExpenseFormState } from "@/app/actions/expenses";
import { TextField, SelectField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const PAYMENT_TERM_LABEL: Record<string, string> = {
  AVISTA: "À vista",
  PRAZO_UNICO: "A prazo (vencimento único)",
  PRAZO_PARCELADO: "A prazo (parcelado)",
};

export function ExpenseForm({
  action,
  initial,
  submitLabel,
  suppliers,
  locked = false,
  isEdit = false,
}: {
  action: (state: ExpenseFormState, formData: FormData) => Promise<ExpenseFormState>;
  initial?: {
    kind: string;
    description: string;
    category: string;
    supplierId: string | null;
    amount: number;
    paymentTerm: string;
    installmentsCount: number;
    installmentIntervalDays: number;
    issuedAt: string;
    firstDueDate?: string;
    competencia: string;
    notes: string | null;
  };
  submitLabel: string;
  suppliers: { id: string; name: string }[];
  locked?: boolean;
  isEdit?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [paymentTerm, setPaymentTerm] = useState(initial?.paymentTerm ?? "AVISTA");

  return (
    <form action={formAction} className="max-w-md space-y-4">
      {!isEdit && (
        <SelectField label="Tipo de conta" name="kind" defaultValue={initial?.kind ?? "FIXA"}>
          <option value="FIXA">Fixa (aluguel, internet, hospedagem…)</option>
          <option value="VARIAVEL">Variável (energia, água…)</option>
        </SelectField>
      )}

      <TextField label="Descrição" name="description" defaultValue={initial?.description} required />
      <TextField
        label="Categoria"
        name="category"
        defaultValue={initial?.category}
        required
        placeholder="Aluguel, Energia, Internet, Hospedagem…"
      />

      <SelectField label="Fornecedor (opcional)" name="supplierId" defaultValue={initial?.supplierId ?? ""}>
        <option value="">Nenhum</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </SelectField>

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Mês de referência"
          name="competencia"
          type="month"
          defaultValue={initial?.competencia}
          required
        />
        <TextField
          label="Data de emissão"
          name="issuedAt"
          type="date"
          defaultValue={initial?.issuedAt}
          required={!locked}
          disabled={locked}
        />
      </div>

      <div className="space-y-3 rounded-lg border border-neutral-800 p-3">
        {locked && (
          <p className="text-xs text-amber-400">
            Já existe parcela paga — para alterar valor/parcelamento, cancele esta conta e lance uma nova.
          </p>
        )}
        <TextField
          label="Valor total (R$)"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          defaultValue={initial?.amount}
          required={!locked}
          disabled={locked}
        />
        <SelectField
          label="Forma de pagamento"
          name="paymentTerm"
          defaultValue={paymentTerm}
          disabled={locked}
          onChange={(e) => setPaymentTerm(e.target.value)}
        >
          {Object.entries(PAYMENT_TERM_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>

        {paymentTerm !== "AVISTA" && (
          <TextField
            label="Data de vencimento"
            name="firstDueDate"
            type="date"
            defaultValue={initial?.firstDueDate}
            required={!locked}
            disabled={locked}
          />
        )}

        {paymentTerm === "PRAZO_PARCELADO" && (
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Nº de parcelas"
              name="installmentsCount"
              type="number"
              min="2"
              defaultValue={initial?.installmentsCount ?? 2}
              disabled={locked}
            />
            <TextField
              label="Intervalo (dias)"
              name="installmentIntervalDays"
              type="number"
              min="1"
              defaultValue={initial?.installmentIntervalDays ?? 30}
              disabled={locked}
            />
          </div>
        )}
      </div>

      <TextField label="Observações" name="notes" defaultValue={initial?.notes ?? undefined} />

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
