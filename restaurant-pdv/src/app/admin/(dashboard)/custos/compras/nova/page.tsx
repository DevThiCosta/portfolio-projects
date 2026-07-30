import { prisma } from "@/lib/prisma";
import { PurchaseForm } from "../purchase-form";

export default async function NovaCompraPage() {
  const [suppliers, insumos] = await Promise.all([
    prisma.supplier.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.insumo.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl uppercase tracking-wide text-neutral-50">Nova compra</h1>
      <p className="text-sm text-neutral-500">
        Itens com insumo selecionado repõem o estoque automaticamente ao salvar.
      </p>
      <PurchaseForm
        suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
        insumos={insumos.map((i) => ({ id: i.id, name: i.name, unit: i.unit }))}
      />
    </div>
  );
}
