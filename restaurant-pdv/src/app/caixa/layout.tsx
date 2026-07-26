import { requireRole } from "@/lib/dal";
import { StaffHeader } from "@/components/staff-header";

export default async function CaixaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["CAIXA", "ADMIN"], "/login");

  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-50">
      <StaffHeader name={session.name} roleLabel="Caixa" />
      <main className="mx-auto max-w-lg px-4 py-4">{children}</main>
    </div>
  );
}
