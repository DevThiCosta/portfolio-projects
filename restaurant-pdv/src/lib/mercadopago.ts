import "server-only";
import { MercadoPagoConfig, Payment as MPPayment } from "mercadopago";

export function isPixConfigured(): boolean {
  return Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN);
}

function getClient() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");
  }
  return new MercadoPagoConfig({ accessToken });
}

export async function createPixCharge(params: {
  comandaId: string;
  amount: number;
  description: string;
  notificationUrl?: string;
}) {
  const client = new MPPayment(getClient());

  const response = await client.create({
    body: {
      transaction_amount: params.amount,
      description: params.description,
      payment_method_id: "pix",
      external_reference: params.comandaId,
      notification_url: params.notificationUrl,
      payer: {
        // Bar de balcão não coleta e-mail do cliente; MP exige o campo mesmo
        // assim para Pix, então usamos um endereço sintético ligado à comanda.
        email: `comanda-${params.comandaId}@barpos.local`,
      },
    },
  });

  const txData = response.point_of_interaction?.transaction_data;
  return {
    paymentId: String(response.id),
    status: response.status,
    qrCode: txData?.qr_code ?? null,
    qrCodeBase64: txData?.qr_code_base64 ?? null,
  };
}

export async function getPixPaymentStatus(paymentId: string) {
  const client = new MPPayment(getClient());
  const response = await client.get({ id: paymentId });
  return { status: response.status, externalReference: response.external_reference };
}
