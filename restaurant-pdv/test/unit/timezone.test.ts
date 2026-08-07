import { describe, it, expect } from "vitest";
import { addCalendarMonthsBrazil, brazilDateFromLabel } from "@/lib/timezone";

describe("addCalendarMonthsBrazil", () => {
  it("dia 31 num mês de 30 dias cai no último dia do mês de destino", () => {
    const result = addCalendarMonthsBrazil(brazilDateFromLabel("2026-01-31"), 1);
    expect(result).toEqual(brazilDateFromLabel("2026-02-28"));
  });

  it("respeita ano bissexto", () => {
    const result = addCalendarMonthsBrazil(brazilDateFromLabel("2028-01-31"), 1);
    expect(result).toEqual(brazilDateFromLabel("2028-02-29"));
  });

  it("dia que existe em ambos os meses não é alterado", () => {
    const result = addCalendarMonthsBrazil(brazilDateFromLabel("2026-01-15"), 1);
    expect(result).toEqual(brazilDateFromLabel("2026-02-15"));
  });

  it("meses negativos voltam no calendário, virando o ano se preciso", () => {
    const result = addCalendarMonthsBrazil(brazilDateFromLabel("2026-01-15"), -1);
    expect(result).toEqual(brazilDateFromLabel("2025-12-15"));
  });
});

describe("brazilDateFromLabel", () => {
  it("meia-noite em Brasília vira 03:00 UTC", () => {
    expect(brazilDateFromLabel("2026-08-07").toISOString()).toBe("2026-08-07T03:00:00.000Z");
  });
});
