"use client";

import { Search } from "lucide-react";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

export function HeaderSearch({ placeholder, locked }: { placeholder: string; locked?: boolean }) {
  const params = useSearchParams();
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        field.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form
      action={locked ? undefined : "/"}
      onSubmit={locked ? (event) => event.preventDefault() : undefined}
      className="relative min-w-0 w-full sm:w-auto sm:min-w-[12rem] sm:max-w-xl sm:flex-1"
    >
      {params.get("from") ? <input type="hidden" name="from" value={params.get("from") ?? ""} /> : null}
      {params.get("to") ? <input type="hidden" name="to" value={params.get("to") ?? ""} /> : null}
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden />
      <input
        ref={field}
        name="q"
        defaultValue={params.get("q") ?? ""}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-full border border-ink/10 bg-white pl-9 pr-16 text-sm text-ink"
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-md bg-mist px-1.5 py-0.5 text-[0.65rem] text-ink/60 sm:inline">
        Ctrl K
      </kbd>
    </form>
  );
}
