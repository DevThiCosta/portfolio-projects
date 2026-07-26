import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getComandaTotal } from "@/app/actions/payments";
import { CashPaymentForm } from "./cash-payment-form";

export default async function CaixaComandaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const comanda = await prisma.comanda.findUnique({
    where: { id },
    include: {
      mesa: true,
      items: {
        where: { status: { not: "CANCELLED" } },
        include: { product: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!comanda) notFound();

  if (comanda.status !== "OPEN") {
    return (
      <div className="space-y-4">
        <Link href="/caixa" className="text-xs text-neutral-500 underline">
          ← comandas
        </Link>
        <h1 className="text-lg font-semibold">{comanda.mesa.label}</h1>
        <p className="text-sm text-neutral-400">
          Esta comanda já foi fechada.
        </p>
      </div>
    );
  }

  const { total, amountDue } = await getComandaTotal(comanda.id);

  return (
    <div className="space-y-5">
      <Link href="/caixa" className="text-xs text-neutral-500 underline">
        ← comandas
      </Link>
      <h1 className="text-lg font-semibold">{comanda.mesa.label}</h1>

      <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
        {comanda.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between px-3 py-2">
            <div>
              <p className="text-sm">
                {item.quantity}x {item.product.name}
              </p>
              {item.notes && (
                <p className="text-xs text-neutral-500">obs: {item.notes}</p>
              )}
            </div>
            <span className="text-sm text-neutral-400">
              R$ {(Number(item.unitPriceAtOrder) * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
        {comanda.items.length === 0 && (
          <p className="px-3 py-2 text-sm text-neutral-500">Sem itens.</p>
        )}
      </div>

      <div className="flex items-center justify-between text-base font-semibold">
        <span>Total</span>
        <span>R$ {total.toFixed(2)}</span>
      </div>
      {amountDue !== total && (
        <div className="flex items-center justify-between text-sm text-emerald-400">
          <span>Já pago (Pix)</span>
          <span>R$ {(total - amountDue).toFixed(2)}</span>
        </div>
      )}
      <div className="flex items-center justify-between text-base font-semibold">
        <span>Restante a pagar</span>
        <span>R$ {amountDue.toFixed(2)}</span>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-neutral-300">Fechar comanda</p>

        <details className="rounded-lg border border-neutral-800 p-3 open:bg-neutral-900">
          <summary className="cursor-pointer text-sm font-medium">
            💵 Dinheiro
          </summary>
          <div className="mt-3">
            <CashPaymentForm comandaId={comanda.id} total={amountDue} />
          </div>
        </details>

        <Link
          href={`/caixa/comanda/${comanda.id}/pix`}
          className="block rounded-lg border border-neutral-800 p-3 text-sm font-medium hover:border-neutral-600"
        >
          📱 Pix
        </Link>

        <Link
          href={`/caixa/comanda/${comanda.id}/cartao`}
          className="block rounded-lg border border-neutral-800 p-3 text-sm font-medium hover:border-neutral-600"
        >
          💳 Cartão (terminal)
        </Link>
      </div>
    </div>
  );
}
