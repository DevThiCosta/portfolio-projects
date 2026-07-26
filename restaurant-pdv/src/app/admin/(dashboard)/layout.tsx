import { requireRole } from "@/lib/dal";
import { StaffHeader } from "@/components/staff-header";

const NAV = [
  { href: "/admin", label: "Início" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/insumos", label: "Insumos" },
  { href: "/admin/mesas", label: "Mesas" },
  { href: "/admin/estoque", label: "Estoque" },
  { href: "/admin/relatorios", label: "Relatórios" },
  { href: "/admin/usuarios", label: "Usuários" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["ADMIN"], "/admin/login");

  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-50">
      <StaffHeader name={session.name} roleLabel="Admin" nav={NAV} />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
