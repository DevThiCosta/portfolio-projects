import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BR_TIME_ZONE } from "@/lib/timezone";

export default async function CaixaPage() {
  const comandas = await prisma.comanda.findMany({
    where: { status: "OPEN" },
    include: {
      mesa: true,
      items: { where: { status: { not: "CANCELLED" } } },
    },
    orderBy: { openedAt: "asc" },
  });

  return (
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
              className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 hover:border-neutral-600"
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
  );
}
