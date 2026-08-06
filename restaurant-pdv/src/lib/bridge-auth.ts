import "server-only";
import { timingSafeEqual } from "crypto";

/** Compara duas strings em tempo constante, evitando vazar por timing o quanto do segredo o chamador acertou. */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Tamanhos diferentes já indicam token errado, mas ainda assim comparamos
  // contra um buffer do mesmo tamanho de `a` pra não vazar o length de `b`
  // via timing do `timingSafeEqual` (que exige buffers de igual tamanho).
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/** Autentica o print-bridge por chave compartilhada — não é uma sessão de staff. */
export function isAuthorizedBridge(req: Request): boolean {
  const expected = process.env.BRIDGE_API_KEY;
  if (!expected) return false;

  const header = req.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && !!token && safeCompare(token, expected);
}
