import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { openComandaFormAction, sendToKitchen } from "@/app/actions/comandas";
import { AddItemPicker } from "./add-item-picker";
import { ComandaItemsList } from "./comanda-items-list";
import { SendToKitchenButton } from "./send-to-kitchen-button";

export default async function MesaComandaPage({
  params,
}: {
  params: Promise<{ mesaId: string }>;
}) {
  const { mesaId } = await params;
  const mesa = await prisma.mesa.findUnique({ where: { id: mesaId } });
  if (!mesa || !mesa.active) notFound();

  const comanda = await prisma.comanda.findFirst({
    where: { mesaId, status: "OPEN" },
    include: {
      items: {
        where: { status: { not: "CANCELLED" } },
        include: { product: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!comanda) {
    const openComandaForMesa = openComandaFormAction.bind(null, mesaId);
    return (
      <div className="space-y-4">
        <Link href="/garcom" className="text-xs text-neutral-500 underline">
          ← mesas
        </Link>
        <h1 className="text-lg font-semibold">{mesa.label}</h1>
        <p className="text-sm text-neutral-400">Mesa livre, sem comanda aberta.</p>
        <form action={openComandaForMesa}>
          <button
            type="submit"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200"
          >
            Abrir comanda
          </button>
        </form>
      </div>
    );
  }

  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const pendingCount = comanda.items.filter((i) => i.status === "PENDING").length;

  const itemsForClient = comanda.items.map((i) => ({
    id: i.id,
    productName: i.product.name,
    quantity: i.quantity,
    unitPrice: Number(i.unitPriceAtOrder),
    notes: i.notes,
    status: i.status,
  }));

  const total = itemsForClient.reduce(
    (sum, i) => sum + i.unitPrice * i.quantity,
    0
  );

  const productsForClient = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: Number(p.price),
  }));

  const sendToKitchenForComanda = sendToKitchen.bind(null, comanda.id);

  return (
    <div className="space-y-5 pb-24">
      <Link href="/garcom" className="text-xs text-neutral-500 underline">
        ← mesas
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{mesa.label}</h1>
        <span className="text-sm text-neutral-400">
          Total: R$ {total.toFixed(2)}
        </span>
      </div>

      <ComandaItemsList items={itemsForClient} />

      <AddItemPicker comandaId={comanda.id} products={productsForClient} />

      <div className="fixed inset-x-0 bottom-0 border-t border-neutral-800 bg-neutral-950 p-4">
        <SendToKitchenButton
          action={sendToKitchenForComanda}
          disabled={pendingCount === 0}
          pendingCount={pendingCount}
        />
      </div>
    </div>
  );
}
