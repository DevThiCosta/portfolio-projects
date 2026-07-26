import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isPixConfigured } from "@/lib/mercadopago";
import { createPixPaymentForComanda, refreshPixPaymentStatus } from "@/app/actions/payments";
import { GeneratePixButton } from "./generate-pix-button";
import { RefreshPixButton } from "./refresh-pix-button";
import { CopyPixCode } from "./copy-pix-code";

export default async function PixPaymentPage({
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

  const pixPayment = await prisma.payment.findFirst({
    where: { comandaId: id, method: "PIX" },
    orderBy: { createdAt: "desc" },
  });

  if (comanda.status !== "OPEN") {
    return (
      <div className="space-y-4">
        <BackLink comandaId={id} />
        <h1 className="text-lg font-semibold">{comanda.mesa.label}</h1>
        <p className="text-sm text-emerald-400">
          Comanda fechada — pagamento via Pix confirmado.
        </p>
      </div>
    );
  }

  if (!pixPayment) {
    const generate = createPixPaymentForComanda.bind(null, id);
    return (
      <div className="space-y-4">
        <BackLink comandaId={id} />
        <h1 className="text-lg font-semibold">{comanda.mesa.label} — Pix</h1>
        {!isPixConfigured() ? (
          <p className="rounded-lg border border-amber-800 bg-amber-950/30 p-3 text-sm text-amber-300">
            Pix ainda não configurado neste servidor. Defina
            MERCADO_PAGO_ACCESS_TOKEN no .env para habilitar cobranças Pix.
          </p>
        ) : (
          <GeneratePixButton action={generate} />
        )}
      </div>
    );
  }

  const qr = pixPayment.gatewayQrCode
    ? (JSON.parse(pixPayment.gatewayQrCode) as {
        qrCode: string | null;
        qrCodeBase64: string | null;
      })
    : null;

  return (
    <div className="space-y-4">
      <BackLink comandaId={id} />
      <h1 className="text-lg font-semibold">{comanda.mesa.label} — Pix</h1>
      <p className="text-sm text-neutral-400">
        Valor: R$ {Number(pixPayment.amount).toFixed(2)}
      </p>

      {pixPayment.status === "PENDING" && qr?.qrCodeBase64 && (
        <div className="space-y-3">
          <div className="flex justify-center rounded-lg bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${qr.qrCodeBase64}`}
              alt="QR Code Pix"
              width={220}
              height={220}
            />
          </div>
          {qr.qrCode && <CopyPixCode code={qr.qrCode} />}
          <p className="text-xs text-neutral-500">
            Aguardando confirmação do pagamento pelo Mercado Pago…
          </p>
          <RefreshPixButton action={refreshPixPaymentStatus.bind(null, id)} />
        </div>
      )}

      {pixPayment.status === "FAILED" && (
        <p className="text-sm text-red-400">Cobrança Pix falhou. Tente novamente.</p>
      )}
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
