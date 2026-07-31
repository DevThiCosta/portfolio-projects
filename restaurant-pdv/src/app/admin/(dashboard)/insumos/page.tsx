import { prisma } from "@/lib/prisma";
import { createInsumo, adjustInsumoStock } from "@/app/actions/insumos";
import { NewInsumoForm } from "./new-insumo-form";
import { AdjustInsumoForm } from "./adjust-insumo-form";
import { ToggleInsumoButton } from "./toggle-insumo-button";
import { WarnGlyph } from "@/components/warn-glyph";

export default async function InsumosPage() {
  const insumos = await prisma.insumo.findMany({ orderBy: { name: "asc" } });

  const recentMovements = await prisma.insumoMovement.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
    include: { insumo: true, createdBy: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-wide text-neutral-50">Insumos</h1>
        <p className="text-sm text-neutral-500">
          Ingredientes crus (cachaça, limão, batata...) usados nas receitas de
          produtos compostos como caipirinha e porções.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {insumos.map((i) => {
              const low =
                i.lowStockThreshold !== null &&
                Number(i.stock) <= Number(i.lowStockThreshold);
              return (
                <div
                  key={i.id}
                  className="flex items-center justify-between gap-2 px-3 py-2"
                >
                  <div>
                    <p
                      className={`text-sm ${!i.active ? "text-neutral-500 line-through" : ""}`}
                    >
                      {i.name}
                    </p>
                    <p
                      className={`flex items-center gap-1 text-xs ${low ? "text-amber-400" : "text-neutral-500"}`}
                    >
                      {Number(i.stock)} {i.unit}
                      {low && <WarnGlyph className="size-3" />}
                    </p>
                  </div>
                  <ToggleInsumoButton insumoId={i.id} active={i.active} />
                </div>
              );
            })}
            {insumos.length === 0 && (
              <p className="px-3 py-2 text-sm text-neutral-500">
                Nenhum insumo cadastrado ainda.
              </p>
            )}
          </div>

          <p className="text-sm font-medium text-neutral-300">Últimas movimentações</p>
          <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800 text-sm">
            {recentMovements.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-3 py-2">
                <div>
                  <p>{m.insumo.name}</p>
                  <p className="text-xs text-neutral-500">
                    {m.reason} · {m.createdBy?.name ?? "sistema"} ·{" "}
                    {m.createdAt.toLocaleString("pt-BR")}
                  </p>
                </div>
                <span className={Number(m.delta) < 0 ? "text-red-400" : "text-emerald-400"}>
                  {Number(m.delta) > 0 ? "+" : ""}
                  {Number(m.delta)}
                </span>
              </div>
            ))}
            {recentMovements.length === 0 && (
              <p className="px-3 py-2 text-neutral-500">Nenhuma movimentação ainda.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-medium text-neutral-300">Novo insumo</p>
            <NewInsumoForm action={createInsumo} />
          </div>
          <div>
            <p className="mb-3 text-sm font-medium text-neutral-300">
              Ajuste manual (reposição, perda, correção)
            </p>
            <AdjustInsumoForm
              action={adjustInsumoStock}
              insumos={insumos.map((i) => ({ id: i.id, name: i.name, unit: i.unit }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
