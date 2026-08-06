import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getComandaTotal } from "@/app/actions/payments";
import { BR_TIME_ZONE } from "@/lib/timezone";
import { CashGlyph, PixGlyph, CardGlyph } from "@/components/payment-glyphs";
import { CashPaymentForm } from "./cash-payment-form";

const METHOD_LABEL: Record<string, string> = {
  DINHEIRO: "dinheiro",
  PIX: "Pix",
  CARTAO_TERMINAL: "cartão",
};

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
      payments: { where: { status: "CONFIRMED" }, orderBy: { confirmedAt: "asc" } },
    },
  });

  if (!comanda) notFound();

  if (comanda.status !== "OPEN") {
    const total = comanda.items.reduce(
      (sum, i) => sum + Number(i.unitPriceAtOrder) * i.quantity,
      0
    );
    return (
      <div className="space-y-5">
        <Link href="/caixa" className="text-xs text-neutral-500 underline">
          ← comandas
        </Link>
        <h1 className="font-display text-xl uppercase tracking-wide text-neutral-50">{comanda.mesa.label}</h1>
        <p className="text-sm text-emerald-400">
          {comanda.status === "CLOSED" ? "Comanda fechada" : "Comanda cancelada"}
          {comanda.closedAt &&
            ` às ${comanda.closedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: BR_TIME_ZONE })}`}
        </p>

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

        {comanda.payments.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-neutral-300">Pagamentos</p>
            {comanda.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">
                  {METHOD_LABEL[p.method] ?? p.method}
                </span>
                <span>R$ {Number(p.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const { total, amountDue } = await getComandaTotal(comanda.id);

  return (
    <div className="space-y-5">
      <Link href="/caixa" className="text-xs text-neutral-500 underline">
        ← comandas
      </Link>
      <h1 className="font-display text-xl uppercase tracking-wide text-neutral-50">{comanda.mesa.label}</h1>

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

        <details className="group rounded-lg border border-neutral-800 p-3 transition-colors open:bg-neutral-900">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <CashGlyph className="size-4.5 text-neutral-400 group-open:text-accent" />
            Dinheiro
          </summary>
          <div className="mt-3">
            <CashPaymentForm comandaId={comanda.id} total={amountDue} />
          </div>
        </details>

        <Link
          href={`/caixa/comanda/${comanda.id}/pix`}
          className="flex items-center gap-2 rounded-lg border border-neutral-800 p-3 text-sm font-medium transition-colors hover:border-neutral-600"
        >
          <PixGlyph className="size-4.5 text-neutral-400" />
          Pix
        </Link>

        <Link
          href={`/caixa/comanda/${comanda.id}/cartao`}
          className="flex items-center gap-2 rounded-lg border border-neutral-800 p-3 text-sm font-medium transition-colors hover:border-neutral-600"
        >
          <CardGlyph className="size-4.5 text-neutral-400" />
          Cartão (terminal)
        </Link>
      </div>
    </div>
  );
}
