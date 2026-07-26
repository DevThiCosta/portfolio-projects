import { prisma } from "@/lib/prisma";
import { createMesa } from "@/app/actions/mesas";
import { NewMesaForm } from "./new-mesa-form";
import { ToggleMesaButton } from "./toggle-mesa-button";

export default async function MesasPage() {
  const mesas = await prisma.mesa.findMany({
    orderBy: { label: "asc" },
    include: {
      comandas: { where: { status: "OPEN" }, select: { id: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mesas</h1>
      </div>

      <NewMesaForm action={createMesa} />

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {mesas.map((mesa) => {
          const ocupada = mesa.comandas.length > 0;
          return (
            <div
              key={mesa.id}
              className={`rounded-lg border p-3 text-center ${
                !mesa.active
                  ? "border-neutral-800 bg-neutral-900 opacity-50"
                  : ocupada
                    ? "border-amber-700 bg-amber-950/30"
                    : "border-neutral-800 bg-neutral-900"
              }`}
            >
              <p className="text-sm font-medium">{mesa.label}</p>
              <p className="mb-2 text-xs text-neutral-500">
                {!mesa.active ? "inativa" : ocupada ? "ocupada" : "livre"}
              </p>
              <ToggleMesaButton mesaId={mesa.id} active={mesa.active} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
