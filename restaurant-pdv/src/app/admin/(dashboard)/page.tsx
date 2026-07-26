import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminHomePage() {
  const [openComandas, trackedProducts, pendingPrintJobs] = await Promise.all([
    prisma.comanda.count({ where: { status: "OPEN" } }),
    prisma.product.findMany({
      where: { active: true, stock: { not: null }, lowStockThreshold: { not: null } },
      select: { stock: true, lowStockThreshold: true },
    }),
    prisma.printJob.count({ where: { status: { in: ["PENDING", "FAILED"] } } }),
  ]);
  const lowStockCount = trackedProducts.filter(
    (p) => (p.stock ?? 0) <= (p.lowStockThreshold ?? 0)
  ).length;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Visão geral</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card label="Comandas abertas" value={openComandas} href="/caixa" />
        <Card
          label="Impressão pendente/falhou"
          value={pendingPrintJobs}
          href="/admin/relatorios"
          warn={pendingPrintJobs > 0}
        />
        <Card
          label="Produtos com estoque baixo"
          value={lowStockCount}
          href="/admin/estoque"
          warn={lowStockCount > 0}
        />
      </div>
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

function Card({
  label,
  value,
  href,
  warn,
}: {
  label: string;
  value: number;
  href: string;
  warn?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl border p-4 transition hover:border-neutral-600 ${
        warn ? "border-amber-700 bg-amber-950/30" : "border-neutral-800 bg-neutral-900"
      }`}
    >
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-sm text-neutral-400">{label}</p>
    </Link>
  );
}
