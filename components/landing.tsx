import type { Copy } from "@/lib/i18n";
import { Caveat, Instrument_Serif, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { ArrowRight, BookOpen, Lock } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"] });
const caveat = Caveat({ subsets: ["latin"], weight: ["600", "700"] });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic" });

function Note({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div className={`pointer-events-none absolute items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-pine shadow-[0_4px_15px_rgba(0,0,0,0.03)] motion-reduce:animate-none ${className}`}>
      {children}
    </div>
  );
}

export function Landing({ text }: { text: Copy }) {
  return (
    <div className={`${jakarta.className} relative flex min-h-dvh flex-col overflow-x-hidden bg-paper bg-[radial-gradient(rgb(var(--soft))_1.1px,transparent_1.1px)] text-pine [background-size:26px_26px]`}>
      <header className="z-20 flex w-full flex-wrap items-center justify-between gap-3 px-4 pb-4 pt-6 sm:px-6 lg:px-14">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-ink/15 bg-white/80 text-pine shadow-sm">
            <BookOpen className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className={`${playfair.className} flex flex-wrap items-center gap-2`}>
              <span className="text-lg font-bold tracking-tight text-ink">SIRA</span>
              <span className="text-xs text-accent" aria-hidden>◆</span>
              <span className={`${instrument.className} text-sm text-pine/80`}>{text.landingBrand}</span>
            </div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-pine/80/80">{text.landingKicker}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="hidden items-center gap-2 rounded-full bg-white/60 px-3 py-1.5 text-[0.7rem] font-medium text-ink sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            {text.landingEncrypt}
          </p>
          <Link href="/login" className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-pine/5 px-3 text-xs font-semibold text-pine">
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            {text.landingQuick}
          </Link>
        </div>
      </header>

      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <Note className="left-4 top-28 hidden animate-drift-a md:flex lg:left-16">
          <span className="text-accent">✨</span>
          <span className={`${caveat.className} text-sm font-bold`}>{text.landingQuote1}</span>
        </Note>
        <Note className="right-4 top-28 hidden animate-drift-b md:flex lg:right-16">
          <span>🛡️</span>
          <span className="text-[0.7rem] font-medium">{text.landingQuote2}</span>
        </Note>
        <Note className="left-4 top-[48%] hidden animate-drift-c lg:flex lg:left-10">
          <span className="text-accent">🌿</span>
          <span className="text-[0.7rem]">{text.landingQuote3}</span>
        </Note>
        <Note className="right-4 top-[46%] hidden animate-drift-a lg:flex lg:right-12">
          <span className="font-semibold text-emerald-700">↗</span>
          <span className="text-[0.7rem] font-semibold">{text.landingQuote4}</span>
        </Note>
        <Note className="bottom-36 left-4 hidden animate-drift-b md:flex lg:left-16">
          <span>🌱</span>
          <span className="text-[0.7rem]">{text.landingQuote5}</span>
          <span className="text-[0.7rem] font-semibold">{text.landingQuote5b}</span>
        </Note>
        <Note className="bottom-40 right-4 hidden animate-drift-c md:flex lg:right-20">
          <span>🕊️</span>
          <span className="text-[0.7rem]">{text.landingQuote6}</span>
        </Note>
        <Note className="right-[18%] top-16 hidden animate-drift-a xl:flex">
          <span>🔒</span>
          <span className="text-[0.65rem] text-pine/80">{text.landingQuote7}</span>
        </Note>
        <Note className="bottom-24 left-[22%] hidden animate-drift-b xl:flex">
          <span>🏷️</span>
          <span className="text-[0.65rem] text-pine/80">{text.landingQuote8}</span>
        </Note>
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-4 py-6 text-center sm:px-6 md:py-10">
        <div className="mb-4 flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-ink/15 bg-white/80 text-accent shadow-sm">
            <Lock className="h-5 w-5" aria-hidden />
          </div>
          <p className="flex max-w-xl flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs font-semibold text-pine/80">
            <span>{text.landingPrivacy}</span>
            <span className="text-accent" aria-hidden>•</span>
            <span>{text.landingPrivacyLine}</span>
          </p>
          <p className="text-xs text-accent/80" aria-hidden>✦ ——— ✦</p>
        </div>
        <h1 className={`${playfair.className} text-[clamp(3rem,12vw,6rem)] font-bold leading-none tracking-tight text-ink`}>SIRA</h1>
        <p className={`${caveat.className} mb-6 mt-2 max-w-xl text-[clamp(1.5rem,4vw,1.9rem)] font-bold leading-tight text-pine/80`}>
          {text.landingSubtitle} <span className="font-normal text-expense">♡</span>
        </p>
        <p className="mb-8 max-w-2xl text-sm leading-relaxed text-pine/80 sm:text-base">{text.landingLead}</p>
        <Link
          href="/login"
          className="inline-flex min-h-12 w-full max-w-xl flex-wrap items-center justify-center gap-3 rounded-full border border-accent/30 bg-gradient-to-r from-ink via-pine to-pine px-5 py-3 text-white shadow-lg sm:w-auto sm:px-8"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/40 bg-accent/25 text-sm" aria-hidden>🗝️</span>
          <span className={`${playfair.className} text-lg font-semibold sm:text-xl`}>{text.landingCta}</span>
          <span className="rounded-full border border-amber-300/30 bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-100">{text.landingCtaMode}</span>
          <ArrowRight className="h-5 w-5 text-amber-100" aria-hidden />
        </Link>
        <p className={`${caveat.className} mt-3 text-base font-bold text-accent`}>
          ✨ {text.landingCtaHint} <span className="font-normal text-expense">♡</span>
        </p>
        <ul className="mt-12 grid w-full gap-4 md:grid-cols-3">
          <li className="rounded-2xl border border-ink/15 bg-white/85 p-5 text-left shadow-[0_10px_30px_-5px_rgba(26,51,41,0.04)]">
            <p className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200/50 bg-amber-50 text-base" aria-hidden>🔒</p>
            <h2 className={`${playfair.className} text-base font-bold text-ink`}>{text.landingCipherTitle}</h2>
            <p className="mt-1 text-xs leading-relaxed text-pine/80">{text.landingCipherBody}</p>
          </li>
          <li className="rounded-2xl border border-ink/15 bg-white/85 p-5 text-left shadow-[0_10px_30px_-5px_rgba(26,51,41,0.04)]">
            <p className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200/50 bg-emerald-50 text-base" aria-hidden>👥</p>
            <h2 className={`${playfair.className} text-base font-bold text-ink`}>{text.landingDuoTitle}</h2>
            <p className="mt-1 text-xs leading-relaxed text-pine/80">{text.landingDuoBody}</p>
          </li>
          <li className="rounded-2xl border border-ink/15 bg-white/85 p-5 text-left shadow-[0_10px_30px_-5px_rgba(26,51,41,0.04)]">
            <p className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200/50 bg-amber-50 text-base" aria-hidden>🏷️</p>
            <h2 className={`${playfair.className} text-base font-bold text-ink`}>{text.landingPlanTitle}</h2>
            <p className="mt-1 text-xs leading-relaxed text-pine/80">{text.landingPlanBody}</p>
          </li>
        </ul>
      </main>

      <footer className="relative z-20 mt-10 border-t border-ink/20 bg-white/40 px-4 py-5 text-xs text-pine/80 sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-3 text-center md:flex-row md:text-left">
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span className={`${playfair.className} font-bold text-ink`}>SIRA</span>
            <span>{text.landingFooter}</span>
            <span className="text-expense" aria-hidden>♡</span>
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/privacy" className="inline-flex min-h-11 items-center hover:text-ink">{text.privacyLink}</Link>
            <Link href="/terms" className="inline-flex min-h-11 items-center hover:text-ink">{text.termsLink}</Link>
            <span>{text.landingOffline}</span>
            <span className="font-medium text-expense">{text.landingMade} © 2026</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
