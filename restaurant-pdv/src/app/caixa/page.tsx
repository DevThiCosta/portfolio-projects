import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { BR_TIME_ZONE } from "@/lib/timezone";

const METHOD_LABEL: Record<string, string> = {
  DINHEIRO: "dinheiro",
  PIX: "Pix",
  CARTAO_TERMINAL: "cartão",
};

export default async function CaixaPage() {
  const session = await verifySession();

  const [comandas, closedThisSession] = await Promise.all([
    prisma.comanda.findMany({
      where: { status: "OPEN" },
      include: {
        mesa: true,
        items: { where: { status: { not: "CANCELLED" } } },
      },
      orderBy: { openedAt: "asc" },
    }),
    session
      ? prisma.comanda.findMany({
          where: { status: "CLOSED", closedAt: { gte: new Date(session.issuedAt) } },
          include: {
            mesa: true,
            payments: { where: { status: "CONFIRMED" } },
          },
          orderBy: { closedAt: "desc" },
        })
      : [],
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-lg font-semibold">Comandas abertas</h1>

        {comandas.length === 0 && (
          <p className="text-sm text-neutral-500">Nenhuma comanda aberta no momento.</p>
        )}

        <div className="space-y-2">
          {comandas.map((c) => {
            const total = c.items.reduce(
              (sum, i) => sum + Number(i.unitPriceAtOrder) * i.quantity,
              0
            );
            const pendingKitchen = c.items.some((i) => i.status === "PENDING");
            return (
              <Link
                key={c.id}
                href={`/caixa/comanda/${c.id}`}
                className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 hover:border-neutral-600 active:scale-[0.99]"
              >
                <div>
                  <p className="text-sm font-medium">{c.mesa.label}</p>
                  <p className="text-xs text-neutral-500">
                    aberta às{" "}
                    {c.openedAt.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: BR_TIME_ZONE,
                    })}
                    {pendingKitchen && " · itens ainda não enviados"}
                  </p>
                </div>
                <span className="text-sm font-medium">R$ {total.toFixed(2)}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-400">
          Comandas fechadas nesta sessão
        </h2>
        <p className="text-xs text-neutral-600">
          Só pra consulta rápida em caso de dúvida — some quando você sair e
          entrar de novo.
        </p>

        {closedThisSession.length === 0 && (
          <p className="text-sm text-neutral-500">
            Nenhuma comanda fechada ainda nesta sessão.
          </p>
        )}

        <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
          {closedThisSession.map((c) => {
            const paid = c.payments.reduce((sum, p) => sum + Number(p.amount), 0);
            const methods = [...new Set(c.payments.map((p) => METHOD_LABEL[p.method] ?? p.method))];
            return (
              <Link
                key={c.id}
                href={`/caixa/comanda/${c.id}`}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-neutral-900"
              >
                <div>
                  <p className="font-medium">{c.mesa.label}</p>
                  <p className="text-xs text-neutral-500">
                    fechada às{" "}
                    {c.closedAt?.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: BR_TIME_ZONE,
                    })}
                    {methods.length > 0 && ` · ${methods.join(" + ")}`}
                  </p>
                </div>
                <span className="text-neutral-400">R$ {paid.toFixed(2)}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
