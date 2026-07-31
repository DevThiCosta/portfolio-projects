import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-neutral-950 px-4 text-center text-neutral-50">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-neutral-500">
        Erro 404
      </p>
      <h1 className="mb-3 font-display text-3xl uppercase tracking-wide">
        Página não encontrada
      </h1>
      <p className="mb-8 max-w-sm text-sm text-neutral-400">
        Essa página não existe ou o que você procura já não está mais aqui.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
