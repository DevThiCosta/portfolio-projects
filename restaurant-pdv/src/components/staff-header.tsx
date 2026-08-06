import { logout } from "@/app/actions/auth";
import { TicketGlyph } from "@/components/ticket-glyph";
import { StaffNav } from "@/components/staff-nav";

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
        <span className="flex shrink-0 items-center gap-1.5 font-display text-lg uppercase tracking-wide text-accent">
          <TicketGlyph className="size-5" />
          Bar POS
        </span>
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate text-xs text-neutral-400">
            {name} · {roleLabel}
          </span>
          <form action={logout} className="shrink-0">
            <button className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:border-neutral-600 hover:bg-neutral-900 active:scale-[0.98]">
              Sair
            </button>
          </form>
        </div>
      </div>
      {nav && nav.length > 0 && <StaffNav nav={nav} />}
    </header>
  );
}
