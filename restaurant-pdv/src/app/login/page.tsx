import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PinLoginForm } from "./pin-login-form";

export default async function LoginPage() {
  const users = await prisma.user.findMany({
    where: { active: true, role: { in: ["GARCOM", "CAIXA"] } },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-neutral-950 px-4 py-10 text-neutral-50">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-semibold">Bar POS</h1>
        <p className="mb-8 text-center text-sm text-neutral-400">
          Selecione seu nome e digite o PIN
        </p>
        <PinLoginForm users={users} />
        <div className="mt-10 text-center">
          <Link
            href="/admin/login"
            className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-300"
          >
            Sou administrador(a)
          </Link>
        </div>
      </div>
    </main>
  );
}
