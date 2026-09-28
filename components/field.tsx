import type { ReactNode, SelectHTMLAttributes } from "react";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint ? <span className="text-xs text-ink/70">{hint}</span> : null}
    </label>
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-base"
    />
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return <p className="rounded-xl bg-mist px-3 py-2 text-sm text-ink">{children}</p>;
}
