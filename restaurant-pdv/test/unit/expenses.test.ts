import { describe, it, expect } from "vitest";
import { computeInstallments } from "@/lib/expenses";
import { brazilDateFromLabel } from "@/lib/timezone";

const issuedAt = brazilDateFromLabel("2026-08-01");

describe("computeInstallments", () => {
  it("à vista nasce como uma parcela já paga", () => {
    const result = computeInstallments({
      paymentTerm: "AVISTA",
      amount: 100,
      installmentsCount: 1,
      intervalDays: 30,
      issuedAt,
    });
    expect(result).toEqual([
      { number: 1, dueDate: issuedAt, amount: 100, paid: true, paidAt: issuedAt },
    ]);
  });

  it("prazo único gera uma parcela não paga no vencimento informado", () => {
    const firstDueDate = brazilDateFromLabel("2026-09-01");
    const result = computeInstallments({
      paymentTerm: "PRAZO_UNICO",
      amount: 100,
      installmentsCount: 1,
      intervalDays: 30,
      firstDueDate,
      issuedAt,
    });
    expect(result).toEqual([
      { number: 1, dueDate: firstDueDate, amount: 100, paid: false, paidAt: null },
    ]);
  });

  it("prazo único e parcelado exigem firstDueDate", () => {
    expect(() =>
      computeInstallments({
        paymentTerm: "PRAZO_UNICO",
        amount: 100,
        installmentsCount: 1,
        intervalDays: 30,
        issuedAt,
      })
    ).toThrow();
  });

  it("parcelado divide o valor em centavos, sobra fica na última parcela", () => {
    const firstDueDate = brazilDateFromLabel("2026-09-01");
    const result = computeInstallments({
      paymentTerm: "PRAZO_PARCELADO",
      amount: 100,
      installmentsCount: 3,
      intervalDays: 30,
      firstDueDate,
      issuedAt,
    });
    expect(result.map((i) => i.amount)).toEqual([33.33, 33.33, 33.34]);
    expect(result.reduce((sum, i) => sum + i.amount, 0)).toBeCloseTo(100, 5);
  });

  it("parcelas vencem espaçadas por intervalDays a partir da primeira", () => {
    const firstDueDate = brazilDateFromLabel("2026-09-01");
    const result = computeInstallments({
      paymentTerm: "PRAZO_PARCELADO",
      amount: 90,
      installmentsCount: 3,
      intervalDays: 15,
      firstDueDate,
      issuedAt,
    });
    expect(result.map((i) => i.dueDate.toISOString().slice(0, 10))).toEqual([
      "2026-09-01",
      "2026-09-16",
      "2026-10-01",
    ]);
  });
});
