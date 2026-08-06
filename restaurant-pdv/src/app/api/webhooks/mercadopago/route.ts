import { NextResponse } from "next/server";
import { WebhookSignatureValidator } from "mercadopago";
import { confirmPixPaymentIfApproved } from "@/lib/pix-confirmation";

export async function POST(req: Request) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  const url = new URL(req.url);
  const body = await req.json().catch(() => null);

  const dataId = url.searchParams.get("data.id") ?? body?.data?.id ?? null;

  if (!dataId) {
    // Nada para processar (ex: notificação de teste do painel do Mercado Pago).
    return NextResponse.json({ ok: true });
  }

  // Falha fechado: sem o secret, não há como provar que a chamada veio do
  // Mercado Pago, então a requisição é rejeitada em vez de processada sem
  // verificação. Nunca trate "secret não configurado" como "pode confiar".
  if (!secret) {
    console.error(
      "MERCADO_PAGO_WEBHOOK_SECRET não configurado — rejeitando notificação do webhook."
    );
    return NextResponse.json({ error: "webhook not configured" }, { status: 401 });
  }

  try {
    WebhookSignatureValidator.validate({
      xSignature: req.headers.get("x-signature"),
      xRequestId: req.headers.get("x-request-id"),
      dataId,
      secret,
      toleranceSeconds: 300,
    });
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  try {
    await confirmPixPaymentIfApproved(String(dataId));
  } catch (err) {
    console.error("Erro ao processar webhook do Mercado Pago:", err);
    // Responde 200 mesmo assim — o Mercado Pago reenviaria a mesma notificação
    // indefinidamente em caso de erro nosso; erros ficam só no log do servidor.
  }

  return NextResponse.json({ ok: true });
}
