import "server-only";

/** Autentica o print-bridge por chave compartilhada — não é uma sessão de staff. */
export function isAuthorizedBridge(req: Request): boolean {
  const expected = process.env.BRIDGE_API_KEY;
  if (!expected) return false;

  const header = req.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token === expected;
}
