import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { decrypt, getSessionCookie } from "@/lib/session";
import type { Role } from "@/generated/prisma/client";

export const verifySession = cache(async () => {
  const cookie = await getSessionCookie();
  const session = await decrypt(cookie);

  if (!session || session.expiresAt < Date.now()) {
    return null;
  }

  return session;
});

/** Garante sessão válida; redireciona para o login apropriado se não houver. */
export async function requireSession(loginPath = "/login") {
  const session = await verifySession();
  if (!session) {
    redirect(loginPath);
  }
  return session;
}

/** Garante sessão válida com um dos papéis permitidos. */
export async function requireRole(roles: Role[], loginPath = "/login") {
  const session = await requireSession(loginPath);
  if (!roles.includes(session.role)) {
    redirect(loginPath);
  }
  return session;
}
