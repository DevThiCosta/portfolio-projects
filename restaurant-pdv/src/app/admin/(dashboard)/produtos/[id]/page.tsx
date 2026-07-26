import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateProduct } from "@/app/actions/products";
import { ProductForm } from "../product-form";

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  const boundUpdate = updateProduct.bind(null, product.id);

  return (
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
  );
}
