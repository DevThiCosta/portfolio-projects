"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";

/** Reimprimir é só voltar o job pra fila — o print-bridge pega no próximo ciclo de polling. */
export async function reprintJob(jobId: string) {
  await requireRole(["ADMIN", "CAIXA"], "/login");

  await prisma.printJob.update({
    where: { id: jobId },
    data: { status: "PENDING", attempts: 0, errorMessage: null },
  });

  revalidatePath("/admin");
  revalidatePath("/caixa");
}
