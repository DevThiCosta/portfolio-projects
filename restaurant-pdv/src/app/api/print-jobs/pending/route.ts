import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedBridge } from "@/lib/bridge-auth";

export async function GET(req: Request) {
  if (!isAuthorizedBridge(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const jobs = await prisma.printJob.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: 20,
    select: { id: true, payload: true, attempts: true, createdAt: true },
  });

  return NextResponse.json({ jobs });
}
