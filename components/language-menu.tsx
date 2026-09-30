"use client";

import { setLocaleAction } from "@/lib/auth/actions";
import type { Locale } from "@/lib/i18n";
import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const languages: { code: Locale; flag: string; name: string }[] = [
  { code: "es", flag: "🇪🇸", name: "Español" },
  { code: "en", flag: "🇬🇧", name: "English" },
  { code: "it", flag: "🇮🇹", name: "Italiano" },
  { code: "fr", flag: "🇫🇷", name: "Français" },
  { code: "de", flag: "🇩🇪", name: "Deutsch" },
];

// En el menú lateral el listado sale hacia la derecha. En el móvil, hacia arriba.
export function LanguageMenu({
  locale,
  label,
  next,
  placement,
}: {
  locale: string;
  label: string;
  next: string;
  placement: "side" | "up";
}) {
  const current = languages.find((item) => item.code === locale) ?? languages[0];
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointer(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  const panel = placement === "side"
    ? "absolute bottom-0 left-full z-40 ml-3 w-56"
    : "absolute bottom-full left-0 z-40 mb-2 w-56";

  return (
    <form ref={root} action={setLocaleAction} className="relative">
      <input type="hidden" name="next" value={next || "/"} />
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${label}: ${current.name}`}
        className={placement === "side"
          ? "flex min-h-11 w-full items-center gap-3 rounded-full px-3 text-left text-sm text-ink/80 hover:bg-mist"
          : "flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-[0_8px_24px_rgba(20,39,31,0.12)] ring-1 ring-ink/10"}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={placement === "side" ? "text-xl leading-none" : ""} aria-hidden>{current.flag}</span>
        {placement === "side" ? <span className="min-w-0 flex-1 truncate">{current.name}</span> : null}
        {placement === "side" ? <ChevronRight className="h-4 w-4 shrink-0 text-ink/40" aria-hidden /> : null}
      </button>
      {open ? (
        <ul role="listbox" aria-label={label} className={`${panel} grid gap-1 rounded-3xl bg-white p-2 text-ink shadow-[0_12px_40px_rgba(20,39,31,0.12)] ring-1 ring-ink/10`}>
          {languages.map((item) => (
            <li key={item.code}>
              <button
                type="submit"
                name="locale"
                value={item.code}
                className={`flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm ${item.code === current.code ? "bg-pine text-white" : "hover:bg-mist"}`}
              >
                <span className="text-xl leading-none" aria-hidden>{item.flag}</span>
                <span>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
