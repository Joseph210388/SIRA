import { VaultTabs } from "@/components/vault-tabs";
import type { Copy } from "@/lib/i18n";
import { BookOpen, Lock, Shield, Users } from "lucide-react";
import { Instrument_Serif, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"] });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic" });

export function PublicPage({ text, children }: { text: Copy; children: ReactNode }) {
  return (
    <div className={`${jakarta.className} min-h-dvh overflow-x-hidden bg-paper bg-[radial-gradient(rgb(var(--soft))_1.1px,transparent_1.1px)] text-pine [background-size:26px_26px]`}>
      <header className="flex w-full flex-wrap items-center justify-between gap-3 px-4 pb-4 pt-6 sm:px-6 lg:px-14">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-ink/15 bg-white/80 text-pine shadow-sm">
            <BookOpen className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className={`${playfair.className} flex flex-wrap items-center gap-2`}>
              <span className="text-lg font-bold tracking-tight text-ink">SIRA</span>
              <span className="text-xs text-accent" aria-hidden>◆</span>
              <span className={`${instrument.className} text-sm text-pine/80`}>{text.landingBrand}</span>
            </span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <Link href="/privacy" className="inline-flex min-h-11 items-center rounded-full px-3 text-pine/80">{text.privacyLink}</Link>
          <Link href="/terms" className="inline-flex min-h-11 items-center rounded-full px-3 text-pine/80">{text.termsLink}</Link>
        </nav>
      </header>
      {children}
      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-xs text-pine/80 sm:px-6 lg:px-10">
        <p>© 2026 SIRA. Borrador de producto.</p>
        <p>Sistema de Ingresos, Rentas y Ahorro</p>
      </footer>
    </div>
  );
}

export function VaultFrame({ mode, text, children }: { mode: "login" | "register"; text: Copy; children: ReactNode }) {
  return (
    <div className={`${jakarta.className} flex h-dvh max-h-dvh flex-col overflow-hidden bg-paper bg-[radial-gradient(rgb(var(--soft))_1.1px,transparent_1.1px)] text-pine [background-size:26px_26px]`}>
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-ink/15 bg-white/80 text-pine shadow-sm">
            <BookOpen className="h-4 w-4" aria-hidden />
          </span>
          <span className={`${playfair.className} truncate text-lg font-bold tracking-tight text-ink`}>SIRA</span>
        </Link>
        <nav className="flex items-center gap-1 text-xs font-semibold">
          <Link href="/privacy" className="inline-flex min-h-11 items-center rounded-full px-2 text-pine/80 sm:px-3">{text.privacyLink}</Link>
          <Link href="/terms" className="inline-flex min-h-11 items-center rounded-full px-2 text-pine/80 sm:px-3">{text.termsLink}</Link>
        </nav>
      </header>
      <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 items-center gap-4 px-4 pb-4 lg:px-8">
        <section className="max-h-full w-full min-w-0 overflow-y-auto rounded-[1.75rem] border border-ink/15 bg-white/90 p-4 shadow-[0_8px_30px_rgba(20,39,31,0.04)] sm:p-6 lg:max-w-[40rem]">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-pine/5 px-3 py-1 text-[0.7rem] font-medium text-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden />
            {text.vaultStatus}
          </p>
          <VaultTabs mode={mode} unlock={text.vaultUnlock} create={text.vaultCreate} />
          {children}
        </section>
        <aside className="hidden h-fit max-h-full w-full max-w-sm shrink-0 overflow-y-auto rounded-[1.75rem] bg-ink p-5 text-paper lg:block">
          <p className={`${instrument.className} text-sm text-accent`}>Manifiesto</p>
          <h2 className={`${playfair.className} mt-1 text-2xl font-semibold leading-tight`}>{text.vaultAsideTitle}</h2>
          <p className="mt-2 text-sm leading-5 text-white/80">{text.vaultAsideLead}</p>
          <ul className="mt-3 grid gap-2 text-sm">
            <li className="flex gap-2 rounded-2xl bg-white/5 p-2.5">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
              <span><strong className="block text-sm">{text.vaultPointCipher}</strong><span className="text-xs leading-4 text-white/75">{text.vaultPointCipherBody}</span></span>
            </li>
            <li className="flex gap-2 rounded-2xl bg-white/5 p-2.5">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
              <span><strong className="block text-sm">{text.vaultPointQuiet}</strong><span className="text-xs leading-4 text-white/75">{text.vaultPointQuietBody}</span></span>
            </li>
            <li className="flex gap-2 rounded-2xl bg-white/5 p-2.5">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
              <span><strong className="block text-sm">{text.vaultPointDuo}</strong><span className="text-xs leading-4 text-white/75">{text.vaultPointDuoBody}</span></span>
            </li>
          </ul>
          <p className="mt-3 text-xs leading-4 text-white/60">{text.vaultDraft}</p>
        </aside>
      </main>
    </div>
  );
}
