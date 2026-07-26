"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { isRateLimited, registerAttempt, clearAttempts } from "@/lib/rate-limit";

export type PinLoginState = { error?: string } | undefined;

export async function loginWithPin(
  _state: PinLoginState,
  formData: FormData
): Promise<PinLoginState> {
  const userId = String(formData.get("userId") ?? "");
  const pin = String(formData.get("pin") ?? "");

  if (!userId || !pin) {
    return { error: "Selecione seu nome e digite o PIN." };
  }

  if (isRateLimited(`pin:${userId}`)) {
    return { error: "Muitas tentativas. Aguarde alguns minutos." };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.active || !user.pinHash || user.role === "ADMIN") {
    registerAttempt(`pin:${userId}`);
    return { error: "PIN incorreto." };
  }

  const valid = await bcrypt.compare(pin, user.pinHash);
  if (!valid) {
    registerAttempt(`pin:${userId}`);
    return { error: "PIN incorreto." };
  }

  clearAttempts(`pin:${userId}`);
  await createSession({ id: user.id, name: user.name, role: user.role });

  redirect(user.role === "GARCOM" ? "/garcom" : "/caixa");
}

export type AdminLoginState = { error?: string } | undefined;

export async function loginAdmin(
  _state: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Preencha usuário e senha." };
  }

  if (isRateLimited(`admin:${username}`)) {
    return { error: "Muitas tentativas. Aguarde alguns minutos." };
  }

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !user.active || !user.passwordHash || user.role !== "ADMIN") {
    registerAttempt(`admin:${username}`);
    return { error: "Usuário ou senha incorretos." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    registerAttempt(`admin:${username}`);
    return { error: "Usuário ou senha incorretos." };
  }

  clearAttempts(`admin:${username}`);
  await createSession({ id: user.id, name: user.name, role: user.role });
  redirect("/admin");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
