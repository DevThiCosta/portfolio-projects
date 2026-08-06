import type { ButtonHTMLAttributes } from "react";

const VARIANT_CLASS = {
  primary: "bg-accent text-accent-foreground hover:bg-accent-hover",
  success: "bg-emerald-600 text-white hover:bg-emerald-500",
  "success-outline": "border border-emerald-700 text-emerald-400 hover:bg-emerald-950",
  secondary: "border border-neutral-700 text-neutral-300 hover:bg-neutral-900",
  danger: "border border-red-900 text-red-400 hover:bg-red-950",
  warn: "border border-amber-700 text-amber-300 hover:bg-amber-950",
} as const;

const SIZE_CLASS = {
  sm: "rounded-md px-2.5 py-1.5 text-xs",
  md: "rounded-lg px-4 py-2 text-sm",
  lg: "rounded-lg px-4 py-3 text-sm",
} as const;

type Variant = keyof typeof VARIANT_CLASS;
type Size = keyof typeof SIZE_CLASS;

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}) {
  return (
    <button
      className={`font-medium transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 disabled:opacity-50 ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    />
  );
}
