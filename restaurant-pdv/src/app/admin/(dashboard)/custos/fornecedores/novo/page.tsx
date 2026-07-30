import { createSupplier } from "@/app/actions/suppliers";
import { SupplierForm } from "../supplier-form";

export default function NovoFornecedorPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl uppercase tracking-wide text-neutral-50">Novo fornecedor</h1>
      <SupplierForm action={createSupplier} submitLabel="Criar fornecedor" />
    </div>
  );
}
