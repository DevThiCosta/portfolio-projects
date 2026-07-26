import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateProduct } from "@/app/actions/products";
import { addIngredient } from "@/app/actions/insumos";
import { ProductForm } from "../product-form";
import { RecipeEditor } from "./recipe-editor";

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { ingredients: { include: { insumo: true } } },
  });
  if (!product) notFound();

  const boundUpdate = updateProduct.bind(null, product.id);
  const boundAddIngredient = addIngredient.bind(null, product.id);
  const allInsumos = await prisma.insumo.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <h1 className="text-xl font-semibold">Editar produto</h1>
        <ProductForm
          action={boundUpdate}
          submitLabel="Salvar alterações"
          initial={{
            name: product.name,
            category: product.category,
            price: Number(product.price),
            stock: product.stock,
            lowStockThreshold: product.lowStockThreshold,
          }}
        />
      </div>

      <div className="max-w-md space-y-3 border-t border-neutral-800 pt-6">
        <div>
          <h2 className="text-sm font-medium text-neutral-300">
            Receita (produto composto)
          </h2>
          <p className="text-xs text-neutral-500">
            Se este produto tiver insumos aqui (ex: caipirinha = cachaça +
            limão), a disponibilidade dele passa a ser calculada a partir do
            estoque desses insumos, e o campo &quot;estoque atual&quot; acima
            deixa de ser usado.
          </p>
        </div>
        <RecipeEditor
          productId={product.id}
          ingredients={product.ingredients.map((ing) => ({
            id: ing.id,
            insumoName: ing.insumo.name,
            unit: ing.insumo.unit,
            quantityPerUnit: Number(ing.quantityPerUnit),
          }))}
          availableInsumos={allInsumos.map((i) => ({
            id: i.id,
            name: i.name,
            unit: i.unit,
          }))}
          addAction={boundAddIngredient}
        />
      </div>
    </div>
  );
}
