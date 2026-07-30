"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/custos", label: "Resumo" },
  { href: "/admin/custos/contas", label: "Contas" },
  { href: "/admin/custos/compras", label: "Compras" },
  { href: "/admin/custos/fornecedores", label: "Fornecedores" },
];

export function CustosTabs() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {TABS.map((tab) => {
        const active =
          tab.href === "/admin/custos" ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-md border px-3 py-1.5 ${
              active
                ? "border-accent bg-accent text-accent-foreground"
                : "border-neutral-700 text-neutral-300 hover:bg-neutral-900"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
