import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { closeComandaWithCardTerminal, getComandaTotal } from "@/app/actions/payments";
import { ConfirmCardButton } from "./confirm-card-button";

export default async function CardTerminalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const comanda = await prisma.comanda.findUnique({
    where: { id },
    include: { mesa: true },
  });
  if (!comanda) notFound();

  if (comanda.status !== "OPEN") {
    return (
      <div className="space-y-4">
        <BackLink comandaId={id} />
        <h1 className="font-display text-xl uppercase tracking-wide text-neutral-50">{comanda.mesa.label}</h1>
        <p className="text-sm text-emerald-400">Comanda já fechada.</p>
      </div>
    );
  }

  const { total, amountDue } = await getComandaTotal(id);
  const confirm = closeComandaWithCardTerminal.bind(null, id);

  return (
    <div className="space-y-4">
      <BackLink comandaId={id} />
      <h1 className="font-display text-xl uppercase tracking-wide text-neutral-50">{comanda.mesa.label} — Cartão</h1>
      <p className="text-2xl font-semibold">R$ {amountDue.toFixed(2)}</p>
      {amountDue !== total && (
        <p className="text-xs text-neutral-500">
          Total da comanda: R$ {total.toFixed(2)} · já pago: R${" "}
          {(total - amountDue).toFixed(2)}
        </p>
      )}

      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-300">
        <p className="mb-1 font-medium">Como cobrar:</p>
        <ol className="list-decimal space-y-1 pl-4 text-neutral-400">
          <li>Digite o valor acima no terminal de cartão (maquininha).</li>
          <li>Aguarde a aprovação no visor do terminal.</li>
          <li>Só então confirme abaixo.</li>
        </ol>
      </div>

      <ConfirmCardButton action={confirm} />
    </div>
  );
}

function BackLink({ comandaId }: { comandaId: string }) {
  return (
    <Link
      href={`/caixa/comanda/${comandaId}`}
      className="text-xs text-neutral-500 underline"
    >
      ← voltar
    </Link>
  );
}
