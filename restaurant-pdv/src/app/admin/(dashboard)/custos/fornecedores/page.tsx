import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ToggleSupplierButton } from "./toggle-supplier-button";

const KIND_LABEL: Record<string, string> = {
  INSUMO: "Insumo",
  SERVICO: "Serviço",
  AMBOS: "Ambos",
};

export default async function FornecedoresPage() {
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl uppercase tracking-wide text-neutral-50">Fornecedores</h1>
        <Link
          href="/admin/custos/fornecedores/novo"
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
        >
          + Novo fornecedor
        </Link>
      </div>

      <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
        {suppliers.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-2 px-4 py-3">
            <div>
              <p className={`text-sm font-medium ${!s.active ? "text-neutral-500 line-through" : ""}`}>
                {s.name}
              </p>
              <p className="text-xs text-neutral-500">
                {KIND_LABEL[s.kind]}
                {s.contactName && ` · ${s.contactName}`}
                {s.phone && ` · ${s.phone}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/admin/custos/fornecedores/${s.id}`}
                className="text-xs text-neutral-400 underline underline-offset-2 hover:text-neutral-100"
              >
                editar
              </Link>
              <ToggleSupplierButton supplierId={s.id} active={s.active} />
            </div>
          </div>
        ))}
        {suppliers.length === 0 && (
          <p className="px-4 py-3 text-sm text-neutral-500">Nenhum fornecedor cadastrado.</p>
        )}
      </div>
    </div>
  );
}
