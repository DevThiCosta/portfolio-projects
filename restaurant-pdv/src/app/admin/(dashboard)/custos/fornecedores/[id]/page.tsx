import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateSupplier } from "@/app/actions/suppliers";
import { SupplierForm } from "../supplier-form";

export default async function EditarFornecedorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) notFound();

  const boundUpdate = updateSupplier.bind(null, supplier.id);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl uppercase tracking-wide text-neutral-50">Editar fornecedor</h1>
      <SupplierForm action={boundUpdate} submitLabel="Salvar alterações" initial={supplier} />
    </div>
  );
}
