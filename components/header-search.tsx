"use client";

import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";

export function HeaderSearch({ placeholder }: { placeholder: string }) {
  const params = useSearchParams();
  return (
    <form action="/" className="relative min-w-0 w-full sm:max-w-md sm:flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden />
      <input
        name="q"
        defaultValue={params.get("q") ?? ""}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-full border border-ink/10 bg-white pl-9 pr-3 text-sm text-ink"
      />
    </form>
  );
}
