import { describe, it, expect } from "vitest";
import { toCents, centsToAmount } from "@/lib/money";

describe("toCents", () => {
  it("converte reais pra centavos", () => {
    expect(toCents(15)).toBe(1500);
  });

  it("arredonda imprecisão de ponto flutuante", () => {
    expect(toCents(19.9)).toBe(1990);
    expect(toCents(0.1 + 0.2)).toBe(30);
  });
});

describe("centsToAmount", () => {
  it("converte centavos pra reais", () => {
    expect(centsToAmount(1500)).toBe(15);
  });

  it("é o inverso de toCents", () => {
    expect(centsToAmount(toCents(42.37))).toBe(42.37);
  });
});
