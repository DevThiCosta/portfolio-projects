import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BR_TIME_ZONE } from "@/lib/timezone";

const PAYMENT_TERM_LABEL: Record<string, string> = {
  AVISTA: "À vista",
  PRAZO_UNICO: "Prazo único",
  PRAZO_PARCELADO: "Parcelado",
};

export default async function ComprasPage() {
  const purchases = await prisma.expense.findMany({
    where: { kind: { in: ["COMPRA_INSUMO", "COMPRA_SERVICO"] } },
    include: { supplier: true, installments: true },
    orderBy: { issuedAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl uppercase tracking-wide text-neutral-50">Compras</h1>
        <Link
          href="/admin/custos/compras/nova"
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
        >
          + Nova compra
        </Link>
      </div>

      <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
        {purchases.map((p) => {
          const paidCount = p.installments.filter((i) => i.paid).length;
          return (
            <Link
              key={p.id}
              href={`/admin/custos/compras/${p.id}`}
              className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-neutral-900"
            >
              <div>
                <p
                  className={`text-sm font-medium ${p.status === "CANCELADA" ? "text-neutral-500 line-through" : ""}`}
                >
                  {p.description}
                </p>
                <p className="text-xs text-neutral-500">
                  {p.issuedAt.toLocaleDateString("pt-BR", { timeZone: BR_TIME_ZONE })} ·{" "}
                  {PAYMENT_TERM_LABEL[p.paymentTerm]} · parcelas {paidCount}/{p.installments.length}
                  {p.status === "CANCELADA" && " · cancelada"}
                </p>
              </div>
              <span className="text-sm font-medium">R$ {Number(p.amount).toFixed(2)}</span>
            </Link>
          );
        })}
        {purchases.length === 0 && (
          <p className="px-4 py-3 text-sm text-neutral-500">Nenhuma compra registrada.</p>
        )}
      </div>
    </div>
  );
}
