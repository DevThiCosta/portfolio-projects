"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";

const MesaSchema = z.object({
  label: z.string().trim().min(1, "Informe um identificador para a mesa"),
});

export type MesaFormState = { error?: string } | undefined;

export async function createMesa(
  _state: MesaFormState,
  formData: FormData
): Promise<MesaFormState> {
  await requireRole(["ADMIN"], "/admin/login");

  const parsed = MesaSchema.safeParse({ label: formData.get("label") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await prisma.mesa.findUnique({
    where: { label: parsed.data.label },
  });
  if (existing) {
    return { error: "Já existe uma mesa com esse identificador." };
  }

  await prisma.mesa.create({ data: { label: parsed.data.label } });
  revalidatePath("/admin/mesas");
  redirect("/admin/mesas");
}

export async function toggleMesaActive(mesaId: string, active: boolean) {
  await requireRole(["ADMIN"], "/admin/login");

  if (!active) {
    const openComanda = await prisma.comanda.findFirst({
      where: { mesaId, status: "OPEN" },
    });
    if (openComanda) {
      throw new Error(
        "Esta mesa tem uma comanda aberta — feche a conta antes de desativá-la."
      );
    }
  }

  await prisma.mesa.update({ where: { id: mesaId }, data: { active } });
  revalidatePath("/admin/mesas");
}
