"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const HOME_PATHS = new Set(["/admin", "/caixa", "/garcom"]);

export function StaffNav({ nav }: { nav: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-t border-neutral-900 px-2 py-1.5">
      {nav.map((item) => {
        const active = HOME_PATHS.has(item.href)
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-accent/15 font-medium text-accent"
                : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
