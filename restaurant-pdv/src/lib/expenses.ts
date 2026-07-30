import "server-only";

export type InstallmentPlan = {
  number: number;
  dueDate: Date;
  amount: number;
  paid: boolean;
  paidAt: Date | null;
};

/**
 * Gera o plano de parcelas conforme a forma de pagamento.
 * AVISTA nasce com a única parcela já paga. PRAZO_UNICO gera 1 parcela em
 * `firstDueDate`. PRAZO_PARCELADO gera `installmentsCount` parcelas
 * espaçadas por `intervalDays`, dividindo o valor em centavos (o resto do
 * arredondamento fica na última parcela).
 */
export function computeInstallments(input: {
  paymentTerm: "AVISTA" | "PRAZO_UNICO" | "PRAZO_PARCELADO";
  amount: number;
  installmentsCount: number;
  intervalDays: number;
  firstDueDate?: Date;
  issuedAt: Date;
}): InstallmentPlan[] {
  const { paymentTerm, amount, issuedAt } = input;

  if (paymentTerm === "AVISTA") {
    return [{ number: 1, dueDate: issuedAt, amount, paid: true, paidAt: issuedAt }];
  }

  if (!input.firstDueDate) {
    throw new Error("firstDueDate é obrigatório fora de AVISTA");
  }

  if (paymentTerm === "PRAZO_UNICO") {
    return [
      { number: 1, dueDate: input.firstDueDate, amount, paid: false, paidAt: null },
    ];
  }

  const n = Math.max(1, input.installmentsCount);
  const totalCents = Math.round(amount * 100);
  const baseCents = Math.floor(totalCents / n);
  const remainderCents = totalCents - baseCents * n;

  return Array.from({ length: n }, (_, i) => {
    const number = i + 1;
    const dueDate = new Date(input.firstDueDate!.getTime());
    dueDate.setUTCDate(dueDate.getUTCDate() + input.intervalDays * i);
    const cents = baseCents + (number === n ? remainderCents : 0);
    return { number, dueDate, amount: cents / 100, paid: false, paidAt: null };
  });
}
