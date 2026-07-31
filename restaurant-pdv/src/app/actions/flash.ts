"use server";

import { cookies } from "next/headers";
import { FLASH_COOKIE } from "@/lib/flash";

/** Lê e limpa a mensagem de flash pendente. Chamado direto pelo <Toaster> a cada navegação, sem depender do cache de RSC das layouts. */
export async function readFlash(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(FLASH_COOKIE)?.value;
  if (value) cookieStore.delete(FLASH_COOKIE);
  return value ?? null;
}
