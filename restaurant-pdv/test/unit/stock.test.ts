import { describe, it, expect } from "vitest";
import { computeAvailability } from "@/lib/stock";

describe("computeAvailability", () => {
  it("produto simples não rastreado (stock null) fica sem quantidade", () => {
    expect(computeAvailability({ stock: null, ingredients: [] })).toEqual({
      tracked: false,
      quantity: null,
    });
  });

  it("produto simples usa o próprio stock", () => {
    expect(computeAvailability({ stock: 20, ingredients: [] })).toEqual({
      tracked: true,
      quantity: 20,
    });
  });

  it("produto composto usa o insumo mais escasso da receita", () => {
    // caipirinha: 50ml cachaça (1000ml em estoque = 20un), 1un limão (30 em estoque)
    const result = computeAvailability({
      stock: null,
      ingredients: [
        { quantityPerUnit: 50, insumo: { stock: 1000 } },
        { quantityPerUnit: 1, insumo: { stock: 30 } },
      ],
    });
    expect(result).toEqual({ tracked: true, quantity: 20 });
  });

  it("nunca retorna quantidade negativa", () => {
    const result = computeAvailability({
      stock: null,
      ingredients: [{ quantityPerUnit: 10, insumo: { stock: -5 } }],
    });
    expect(result.quantity).toBe(0);
  });

  it("ignora ingrediente com quantityPerUnit inválido em vez de quebrar a conta", () => {
    const result = computeAvailability({
      stock: null,
      ingredients: [
        { quantityPerUnit: 0, insumo: { stock: 100 } },
        { quantityPerUnit: 2, insumo: { stock: 10 } },
      ],
    });
    expect(result).toEqual({ tracked: true, quantity: 5 });
  });
});
