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
    <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/95 text-neutral-50 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="shrink-0 font-semibold">Bar POS</span>
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate text-xs text-neutral-400">
            {name} · {roleLabel}
          </span>
          <form action={logout} className="shrink-0">
            <button className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-900">
              Sair
            </button>
          </form>
        </div>
      </div>
      {nav && nav.length > 0 && (
        <nav className="flex gap-1 overflow-x-auto border-t border-neutral-900 px-2 py-1.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
