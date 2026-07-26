import Link from "next/link";
import { logout } from "@/app/actions/auth";

export function StaffHeader({
  name,
  roleLabel,
  nav,
}: {
  name: string;
  roleLabel: string;
  nav?: { href: string; label: string }[];
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-800 bg-neutral-950/95 px-4 py-3 text-neutral-50 backdrop-blur">
      <div className="flex items-center gap-4">
        <span className="font-semibold">Bar POS</span>
        {nav && nav.length > 0 && (
          <nav className="hidden gap-3 sm:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-neutral-400 hover:text-neutral-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-neutral-400">
          {name} · {roleLabel}
        </span>
        <form action={logout}>
          <button className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-900">
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
