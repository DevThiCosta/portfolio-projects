import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BR_TIME_ZONE, olderThan } from "@/lib/timezone";
import { StatCard } from "@/components/stat-card";
import { ReprintButton } from "./reprint-button";

// Um job PENDING recém-criado é normal (o print-bridge só faz polling a
// cada poucos segundos). Só tratamos como "travado" depois desse limite —
// sinal de que o print-bridge está offline ou a impressora com problema.
const STUCK_THRESHOLD_MS = 60_000;

export default async function AdminHomePage() {
  const stuckSince = olderThan(STUCK_THRESHOLD_MS);

  const [openComandas, trackedProducts, troubledPrintJobs] = await Promise.all([
    prisma.comanda.count({ where: { status: "OPEN" } }),
    prisma.product.findMany({
      where: { active: true, stock: { not: null }, lowStockThreshold: { not: null } },
      select: { stock: true, lowStockThreshold: true },
    }),
    prisma.printJob.findMany({
      where: {
        OR: [{ status: "FAILED" }, { status: "PENDING", createdAt: { lt: stuckSince } }],
      },
      include: { comanda: { include: { mesa: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const lowStockCount = trackedProducts.filter(
    (p) => (p.stock ?? 0) <= (p.lowStockThreshold ?? 0)
  ).length;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl uppercase tracking-wide text-neutral-50">Visão geral</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Comandas abertas" value={openComandas} href="/caixa" />
        <StatCard
          label="Impressão travada/falhou"
          value={troubledPrintJobs.length}
          href="#impressao"
          warn={troubledPrintJobs.length > 0}
        />
        <StatCard
          label="Produtos com estoque baixo"
          value={lowStockCount}
          href="/admin/estoque"
          warn={lowStockCount > 0}
        />
      </div>

      {troubledPrintJobs.length > 0 && (
        <div id="impressao" className="space-y-2">
          <p className="text-sm font-medium text-amber-400">
            Pedidos que podem não ter chegado na cozinha
          </p>
          <div className="divide-y divide-neutral-800 rounded-lg border border-amber-900/50">
            {troubledPrintJobs.map((job) => {
              const payload = job.payload as {
                mesa: string;
                items: { productName: string; quantity: number }[];
              };
              return (
                <div key={job.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{payload.mesa}</p>
                    <p className="text-xs text-neutral-500">
                      {payload.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {job.status === "FAILED" ? "falhou" : "travado"} desde{" "}
                      {job.createdAt.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: BR_TIME_ZONE,
                      })}
                      {job.errorMessage && ` · ${job.errorMessage}`}
                    </p>
                  </div>
                  <ReprintButton jobId={job.id} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="underline underline-offset-2" href="/admin/produtos">
          Gerenciar produtos
        </Link>
        <Link className="underline underline-offset-2" href="/admin/mesas">
          Gerenciar mesas
        </Link>
        <Link className="underline underline-offset-2" href="/admin/usuarios">
          Gerenciar usuários
        </Link>
      </div>
    </div>
  );
}
