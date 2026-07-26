import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAuthorizedBridge } from "@/lib/bridge-auth";

const MAX_ATTEMPTS = 5;

const AckSchema = z.object({
  status: z.enum(["PRINTED", "FAILED"]),
  errorMessage: z.string().max(500).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorizedBridge(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = AckSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const job = await prisma.printJob.findUnique({ where: { id } });
  if (!job) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (body.data.status === "PRINTED") {
    await prisma.printJob.update({
      where: { id },
      data: { status: "PRINTED", printedAt: new Date(), errorMessage: null },
    });
    return NextResponse.json({ ok: true });
  }

  const attempts = job.attempts + 1;
  await prisma.printJob.update({
    where: { id },
    data: {
      attempts,
      errorMessage: body.data.errorMessage ?? "Falha na impressão",
      // Esgotadas as tentativas, o job fica FAILED até alguém reimprimir
      // manualmente (o que apenas volta o status para PENDING).
      status: attempts >= MAX_ATTEMPTS ? "FAILED" : "PENDING",
    },
  });

  return NextResponse.json({ ok: true, willRetry: attempts < MAX_ATTEMPTS });
}
