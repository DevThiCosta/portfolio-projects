import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BR_TIME_ZONE } from "@/lib/timezone";
import { toggleInstallmentPaid } from "@/app/actions/expenses";
import { ToggleActiveButton } from "@/components/ui/toggle-active-button";
import { CancelExpenseButton } from "../../cancel-expense-button";

const PAYMENT_TERM_LABEL: Record<string, string> = {
  AVISTA: "À vista",
  PRAZO_UNICO: "Prazo único",
  PRAZO_PARCELADO: "Parcelado",
};

export default async function DetalheCompraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const purchase = await prisma.expense.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: { include: { insumo: true } },
      installments: { orderBy: { number: "asc" } },
    },
  });
  if (!purchase) notFound();
  if (purchase.kind !== "COMPRA_INSUMO" && purchase.kind !== "COMPRA_SERVICO") notFound();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-wide text-neutral-50">{purchase.description}</h1>
          <p className="text-sm text-neutral-500">
            {purchase.issuedAt.toLocaleDateString("pt-BR", { timeZone: BR_TIME_ZONE })} ·{" "}
            {PAYMENT_TERM_LABEL[purchase.paymentTerm]}
            {purchase.supplier && ` · ${purchase.supplier.name}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {purchase.status === "CANCELADA" ? (
            <span className="rounded-md border border-red-900 px-2 py-1 text-xs text-red-400">
              Cancelada
            </span>
          ) : (
            <CancelExpenseButton expenseId={purchase.id} />
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-neutral-300">Itens</p>
        <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800 text-sm">
          {purchase.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-3 py-2">
              <div>
                <p>{item.description}</p>
                <p className="text-xs text-neutral-500">
                  {item.insumo && `repôs estoque de "${item.insumo.name}" · `}
                  {Number(item.quantity)} × R$ {Number(item.unitCost).toFixed(2)}
                </p>
              </div>
              <span className="font-medium">R$ {Number(item.totalCost).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-right text-sm font-medium">
          Total: R$ {Number(purchase.amount).toFixed(2)}
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-neutral-300">Parcelas</p>
        <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800 text-sm">
          {purchase.installments.map((inst) => (
            <div key={inst.id} className="flex items-center justify-between px-3 py-2">
              <div>
                <p>
                  Parcela {inst.number}/{purchase.installmentsCount} · R${" "}
                  {Number(inst.amount).toFixed(2)}
                </p>
                <p className="text-xs text-neutral-500">
                  Vence {inst.dueDate.toLocaleDateString("pt-BR", { timeZone: BR_TIME_ZONE })}
                  {inst.paid &&
                    inst.paidAt &&
                    ` · pago em ${inst.paidAt.toLocaleDateString("pt-BR", { timeZone: BR_TIME_ZONE })}`}
                </p>
              </div>
              <ToggleActiveButton
                state={inst.paid}
                onToggle={toggleInstallmentPaid.bind(null, inst.id, !inst.paid)}
                onLabel="Marcar como paga"
                offLabel="Desfazer pagamento"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
