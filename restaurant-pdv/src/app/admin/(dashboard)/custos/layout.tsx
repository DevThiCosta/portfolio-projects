import { CustosTabs } from "./custos-tabs";

export default function CustosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl uppercase tracking-wide text-neutral-50">Custos</h1>
        <CustosTabs />
      </div>
      {children}
    </div>
  );
}
