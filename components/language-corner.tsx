import { setLocaleAction } from "@/lib/auth/actions";
import type { Locale } from "@/lib/i18n";

const languages: { code: Locale; flag: string; name: string }[] = [
  { code: "es", flag: "🇪🇸", name: "Español" },
  { code: "en", flag: "🇬🇧", name: "English" },
  { code: "it", flag: "🇮🇹", name: "Italiano" },
  { code: "fr", flag: "🇫🇷", name: "Français" },
  { code: "de", flag: "🇩🇪", name: "Deutsch" },
];

export function LanguageCorner({ locale, label, next, lift = false }: { locale: string; label: string; next: string; lift?: boolean }) {
  const current = languages.find((item) => item.code === locale) ?? languages[0];
  return (
    <form action={setLocaleAction} className={`fixed right-4 z-40 ${lift ? "bottom-24 lg:bottom-4" : "bottom-4"}`}>
      <input type="hidden" name="next" value={next || "/"} />
      <details className="group relative">
        <summary
          aria-label={`${label}: ${current.name}`}
          className="flex h-12 w-12 cursor-pointer list-none items-center justify-center rounded-full bg-white text-2xl shadow-[0_8px_24px_rgba(20,39,31,0.12)] ring-1 ring-ink/10 [&::-webkit-details-marker]:hidden"
        >
          <span aria-hidden>{current.flag}</span>
        </summary>
        <ul className="absolute bottom-14 right-0 grid w-[min(16rem,calc(100vw-2rem))] gap-1 rounded-3xl bg-white p-2 text-ink shadow-[0_12px_40px_rgba(20,39,31,0.12)] ring-1 ring-ink/10">
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
      </details>
    </form>
  );
}
