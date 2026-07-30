import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function GarcomMesasPage() {
  const mesas = await prisma.mesa.findMany({
    where: { active: true },
    orderBy: { label: "asc" },
    include: {
      comandas: { where: { status: "OPEN" }, select: { id: true } },
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl uppercase tracking-wide text-neutral-50">Mesas</h1>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {mesas.map((mesa) => {
          const ocupada = mesa.comandas.length > 0;
          return (
            <Link
              key={mesa.id}
              href={`/garcom/mesa/${mesa.id}`}
              className={`rounded-xl border p-4 text-center transition active:scale-95 ${
                ocupada
                  ? "border-amber-700 bg-amber-950/30"
                  : "border-neutral-800 bg-neutral-900"
              }`}
            >
              <p className="text-sm font-medium">{mesa.label}</p>
              <p className="text-xs text-neutral-500">
                {ocupada ? "ocupada" : "livre"}
              </p>
            </Link>
          );
        })}
        {mesas.length === 0 && (
          <p className="col-span-3 text-sm text-neutral-500 sm:col-span-4 md:col-span-6 lg:col-span-8">
            Nenhuma mesa cadastrada. Peça ao admin para cadastrar em
            /admin/mesas.
          </p>
        )}
      </div>
    </div>
  );
}
