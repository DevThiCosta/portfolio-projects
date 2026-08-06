import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const BASE =
  "rounded-lg border border-neutral-700 bg-neutral-950 text-neutral-50 outline-none transition-colors placeholder:text-neutral-600 focus:border-accent disabled:opacity-50";

const SIZE_CLASS = {
  md: "px-3 py-2 text-sm",
  sm: "px-2 py-2 text-xs",
} as const;

type FieldSize = keyof typeof SIZE_CLASS;

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label className="mb-1 block text-xs text-neutral-400" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

export function TextField({
  label,
  name,
  className = "",
  size = "md",
  fullWidth = true,
  ...inputProps
}: {
  label: string;
  name: string;
  className?: string;
  size?: FieldSize;
  fullWidth?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "name" | "className" | "size">) {
  return (
    <div>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <input
        id={name}
        name={name}
        className={`${BASE} ${SIZE_CLASS[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        {...inputProps}
      />
    </div>
  );
}

export function SelectField({
  label,
  name,
  className = "",
  size = "md",
  fullWidth = true,
  children,
  ...selectProps
}: {
  label: string;
  name: string;
  className?: string;
  size?: FieldSize;
  fullWidth?: boolean;
  children: ReactNode;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "name" | "className" | "size">) {
  return (
    <div>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <select
        id={name}
        name={name}
        className={`${BASE} ${SIZE_CLASS[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        {...selectProps}
      >
        {children}
      </select>
    </div>
  );
}
