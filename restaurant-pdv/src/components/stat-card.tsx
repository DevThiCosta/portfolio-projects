import Link from "next/link";

export function StatCard({
  label,
  value,
  href,
  warn,
  perforated = true,
}: {
  label: string;
  value: React.ReactNode;
  href?: string;
  warn?: boolean;
  perforated?: boolean;
}) {
  const className = `block rounded-xl border p-4 transition-colors ${
    warn
      ? "border-amber-700 bg-amber-950/30 hover:border-amber-600"
      : "border-neutral-800 bg-neutral-900 hover:border-neutral-700"
  } ${perforated ? "card-perforated" : ""}`;

  const content = (
    <>
      <p className="font-display text-3xl text-neutral-50">{value}</p>
      <p className="text-sm text-neutral-400">{label}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}
