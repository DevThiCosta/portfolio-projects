"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";

const StaffSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto"),
  role: z.enum(["GARCOM", "CAIXA"]),
  pin: z.string().regex(/^\d{4}$/, "PIN deve ter exatamente 4 dígitos"),
});

export type StaffFormState = { error?: string } | undefined;

export async function createStaffUser(
  _state: StaffFormState,
  formData: FormData
): Promise<StaffFormState> {
  await requireRole(["ADMIN"], "/admin/login");

  const parsed = StaffSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    pin: formData.get("pin"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const pinHash = await bcrypt.hash(parsed.data.pin, 10);
  await prisma.user.create({
    data: { name: parsed.data.name, role: parsed.data.role, pinHash },
  });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function toggleUserActive(userId: string, active: boolean) {
  await requireRole(["ADMIN"], "/admin/login");
  await prisma.user.update({ where: { id: userId }, data: { active } });
  revalidatePath("/admin/usuarios");
}

const PinSchema = z.string().regex(/^\d{4}$/, "PIN deve ter exatamente 4 dígitos");

export type ResetPinState = { error?: string; success?: boolean } | undefined;

export async function resetUserPin(
  userId: string,
  _state: ResetPinState,
  formData: FormData
): Promise<ResetPinState> {
  await requireRole(["ADMIN"], "/admin/login");

  const parsed = PinSchema.safeParse(formData.get("pin"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const pinHash = await bcrypt.hash(parsed.data, 10);
  await prisma.user.update({ where: { id: userId }, data: { pinHash } });
  revalidatePath("/admin/usuarios");
  return { success: true };
}
