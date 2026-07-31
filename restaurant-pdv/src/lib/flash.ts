import "server-only";
import { cookies } from "next/headers";

export const FLASH_COOKIE = "flash";

/** Guarda uma mensagem de sucesso pra virar toast no próximo request — útil antes de um redirect() em Server Action. */
export async function flashSuccess(message: string) {
  const cookieStore = await cookies();
  cookieStore.set(FLASH_COOKIE, message, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 10,
    sameSite: "lax",
    path: "/",
  });
}
