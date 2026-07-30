import { createProduct } from "@/app/actions/products";
import { ProductForm } from "../product-form";

export default function NovoProdutoPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl uppercase tracking-wide text-neutral-50">Novo produto</h1>
      <ProductForm action={createProduct} submitLabel="Criar produto" />
    </div>
  );
}
