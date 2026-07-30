"use client";

import { useActionState, useTransition } from "react";
import { removeIngredient, type IngredientFormState } from "@/app/actions/insumos";

type IngredientRow = {
  id: string;
  insumoName: string;
  unit: string;
  quantityPerUnit: number;
};

export function RecipeEditor({
  productId,
  ingredients,
  availableInsumos,
  addAction,
}: {
  productId: string;
  ingredients: IngredientRow[];
  availableInsumos: { id: string; name: string; unit: string }[];
  addAction: (state: IngredientFormState, formData: FormData) => Promise<IngredientFormState>;
}) {
  const [state, formAction, pending] = useActionState(addAction, undefined);
  const [removing, startRemoving] = useTransition();

  return (
    <div className="space-y-3">
      <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
        {ingredients.map((ing) => (
          <div key={ing.id} className="flex items-center justify-between px-3 py-2 text-sm">
            <span>
              {ing.quantityPerUnit} {ing.unit} de {ing.insumoName}
            </span>
            <button
              disabled={removing}
              onClick={() => startRemoving(() => removeIngredient(ing.id, productId))}
              className="text-xs text-red-400 underline underline-offset-2 disabled:opacity-50"
            >
              remover
            </button>
          </div>
        ))}
        {ingredients.length === 0 && (
          <p className="px-3 py-2 text-sm text-neutral-500">
            Sem receita — produto simples, usa o estoque próprio.
          </p>
        )}
      </div>

      {availableInsumos.length === 0 ? (
        <p className="text-xs text-neutral-500">
          Cadastre insumos em Admin → Insumos pra poder montar uma receita.
        </p>
      ) : (
        <form action={formAction} className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-neutral-400" htmlFor="insumoId">
              Insumo
            </label>
            <select
              id="insumoId"
              name="insumoId"
              className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
            >
              {availableInsumos.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.unit})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-400" htmlFor="quantityPerUnit">
              Quantidade por unidade vendida
            </label>
            <input
              id="quantityPerUnit"
              name="quantityPerUnit"
              type="number"
              step="0.001"
              min="0"
              required
              className="w-40 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
          >
            Adicionar
          </button>
        </form>
      )}
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
    </div>
  );
}
