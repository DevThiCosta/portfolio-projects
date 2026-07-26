"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAdmin, type AdminLoginState } from "@/app/actions/auth";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState<
    AdminLoginState,
    FormData
  >(loginAdmin, undefined);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-neutral-950 px-4 text-neutral-50">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-6"
      >
        <h1 className="mb-1 text-xl font-semibold">Administração</h1>
        <p className="mb-6 text-sm text-neutral-400">
          Acesso restrito ao dono/gerente do bar
        </p>

        <label className="mb-1 block text-xs text-neutral-400" htmlFor="username">
          Usuário
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          className="mb-4 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />

        <label className="mb-1 block text-xs text-neutral-400" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="mb-4 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />

        {state?.error && (
          <p className="mb-4 text-sm text-red-400">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-white py-2 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200 disabled:opacity-50"
        >
          {pending ? "Entrando…" : "Entrar"}
        </button>

        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-300"
          >
            Sou garçom/caixa
          </Link>
        </div>
      </form>
    </main>
  );
}
