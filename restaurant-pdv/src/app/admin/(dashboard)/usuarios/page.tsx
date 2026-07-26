import { prisma } from "@/lib/prisma";
import { createStaffUser } from "@/app/actions/users";
import { NewStaffForm } from "./new-staff-form";
import { UserRow } from "./user-row";

export default async function UsuariosPage() {
  const users = await prisma.user.findMany({
    where: { role: { in: ["GARCOM", "CAIXA"] } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-semibold">Usuários (garçom/caixa)</h1>

      <NewStaffForm action={createStaffUser} />

      <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
        {users.map((u) => (
          <UserRow key={u.id} id={u.id} name={u.name} role={u.role} active={u.active} />
        ))}
        {users.length === 0 && (
          <p className="px-4 py-3 text-sm text-neutral-500">
            Nenhum garçom/caixa cadastrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
