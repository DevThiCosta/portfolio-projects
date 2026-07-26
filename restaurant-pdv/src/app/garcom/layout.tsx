import { requireRole } from "@/lib/dal";
import { StaffHeader } from "@/components/staff-header";

export default async function GarcomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["GARCOM", "ADMIN"], "/login");

  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-50">
      <StaffHeader name={session.name} roleLabel="Garçom" />
      <main className="mx-auto w-full max-w-4xl px-4 py-4">{children}</main>
    </div>
  );
}
