"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAdmin, type AdminLoginState } from "@/app/actions/auth";
import { TextField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { TicketGlyph } from "@/components/ticket-glyph";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState<
    AdminLoginState,
    FormData
  >(loginAdmin, undefined);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-neutral-950 px-4 text-neutral-50">
      <form
        action={formAction}
        className="card-perforated w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-lg shadow-black/20"
      >
        <span className="mb-4 flex items-center gap-1.5 font-display text-sm uppercase tracking-wide text-accent">
          <TicketGlyph className="size-4" />
          Bar POS
        </span>
        <h1 className="mb-1 font-display text-2xl uppercase tracking-wide text-neutral-50">
          Administração
        </h1>
        <p className="mb-6 text-sm text-neutral-400">
          Acesso restrito ao dono/gerente do bar
        </p>

        <div className="mb-4">
          <TextField label="Usuário" name="username" autoComplete="username" />
        </div>
        <div className="mb-4">
          <TextField
            label="Senha"
            name="password"
            type="password"
            autoComplete="current-password"
          />
        </div>

        {state?.error && (
          <p className="mb-4 text-sm text-red-400">{state.error}</p>
        )}

        <Button type="submit" fullWidth disabled={pending}>
          {pending ? "Entrando…" : "Entrar"}
        </Button>

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
