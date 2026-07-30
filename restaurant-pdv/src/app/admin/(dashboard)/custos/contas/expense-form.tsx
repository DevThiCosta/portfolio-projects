"use client";

import { useActionState, useState } from "react";
import type { ExpenseFormState } from "@/app/actions/expenses";

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
        <div>
          <label className="mb-1 block text-xs text-neutral-400" htmlFor="kind">
            Tipo de conta
          </label>
          <select
            id="kind"
            name="kind"
            defaultValue={initial?.kind ?? "FIXA"}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          >
            <option value="FIXA">Fixa (aluguel, internet, hospedagem…)</option>
            <option value="VARIAVEL">Variável (energia, água…)</option>
          </select>
        </div>
      )}

      <Field label="Descrição" name="description" defaultValue={initial?.description} required />
      <Field
        label="Categoria"
        name="category"
        defaultValue={initial?.category}
        required
        placeholder="Aluguel, Energia, Internet, Hospedagem…"
      />

      <div>
        <label className="mb-1 block text-xs text-neutral-400" htmlFor="supplierId">
          Fornecedor (opcional)
        </label>
        <select
          id="supplierId"
          name="supplierId"
          defaultValue={initial?.supplierId ?? ""}
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

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Mês de referência"
          name="competencia"
          type="month"
          defaultValue={initial?.competencia}
          required
        />
        <Field
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
        <Field
          label="Valor total (R$)"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          defaultValue={initial?.amount}
          required={!locked}
          disabled={locked}
        />
        <div>
          <label className="mb-1 block text-xs text-neutral-400" htmlFor="paymentTerm">
            Forma de pagamento
          </label>
          <select
            id="paymentTerm"
            name="paymentTerm"
            defaultValue={paymentTerm}
            disabled={locked}
            onChange={(e) => setPaymentTerm(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400 disabled:opacity-50"
          >
            {Object.entries(PAYMENT_TERM_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {paymentTerm !== "AVISTA" && (
          <Field
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
            <Field
              label="Nº de parcelas"
              name="installmentsCount"
              type="number"
              min="2"
              defaultValue={initial?.installmentsCount ?? 2}
              disabled={locked}
            />
            <Field
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

      <Field label="Observações" name="notes" defaultValue={initial?.notes ?? undefined} />

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "Salvando…" : submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
  step,
  min,
  disabled,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
  placeholder?: string;
  step?: string;
  min?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-neutral-400" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        min={min}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400 disabled:opacity-50"
      />
    </div>
  );
}
