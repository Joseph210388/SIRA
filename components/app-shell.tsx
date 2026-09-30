import type { OwnProfile } from "@/lib/auth/profile";
import { AppNav } from "@/components/app-nav";
import { NewMovementButton } from "@/components/new-movement-button";
import { HeaderSearch } from "@/components/header-search";
import { LanguageMenu } from "@/components/language-menu";
import { PeriodPicker } from "@/components/period-picker";
import { ProfileMenu } from "@/components/profile-menu";
import { Tooltip } from "@/components/tooltip";
import type { Copy } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { Bell, Plus, UserRound } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";
import { Suspense } from "react";

export async function AppShell({
  text,
  name,
  locale,
  timeZone,
  theme,
  currency,
  holdings,
  setupOpen,
  profile,
  profileError,
  children,
}: {
  text: Copy;
  name: string;
  locale: string;
  timeZone: string;
  theme: string;
  currency: string;
  holdings: { total: number; accounts: { id: string; name: string; balance: number }[] };
  setupOpen: boolean;
  profile: OwnProfile | null;
  profileError: string | null;
  children: ReactNode;
}) {
  const path = (await headers()).get("x-sira-path") ?? "/";
  const search = (await headers()).get("x-sira-search") ?? "";
  return (
    <div data-theme={theme} className="min-h-dvh bg-paper text-ink lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
      <aside className="sticky top-4 z-20 mx-3 mt-4 mb-4 hidden h-[calc(100dvh-2rem)] flex-col overflow-visible rounded-[1.75rem] bg-white px-4 py-5 shadow-[0_8px_30px_rgba(20,39,31,0.06)] ring-1 ring-ink/10 lg:flex">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <p className="text-lg font-semibold tracking-wide text-pine">{text.appName}</p>
          <p className="text-[0.65rem] uppercase tracking-[0.14em] text-ink/60">{text.brandLine}</p>
          <AppNav text={text} variant="side" />
        </div>
        <div className="mt-auto grid gap-3 pt-4">
          {/* Personal / Dúo queda oculto hasta que el dúo esté listo para usarse. */}
          {/* <ModeSwitch text={text} /> */}
          <LanguageMenu locale={locale} label={text.language} next={`${path}${search}`} placement="side" />
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex flex-wrap items-center gap-2 bg-paper/95 px-4 py-3 backdrop-blur sm:gap-3 lg:px-8">
          <Suspense fallback={<div className="min-h-11 w-36 rounded-2xl bg-white ring-1 ring-ink/10" />}>
            <PeriodPicker locale={locale} timeZone={timeZone} wholeMonth={text.wholeMonth} applyLabel={text.applyRange} previousLabel={text.previousPage} nextLabel={text.nextPage} />
          </Suspense>
          <Suspense fallback={<div className="min-h-11 w-full sm:max-w-xl sm:flex-1" />}>
            <HeaderSearch placeholder={text.searchPlaceholder} locked={setupOpen} />
          </Suspense>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Tooltip
              content={holdings.accounts.length === 0 ? text.holdingsLabel : (
                <span className="grid gap-1">
                  {holdings.accounts.map((item) => (
                    <span key={item.id} className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate">{item.name}</span>
                      <span className="shrink-0 tabular-nums">{formatMoney(item.balance, locale, currency)}</span>
                    </span>
                  ))}
                </span>
              )}
            >
              <span className="inline-flex min-h-11 max-w-full items-center gap-2 whitespace-nowrap rounded-full bg-white px-3 text-sm font-medium ring-1 ring-ink/10">
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-600" aria-hidden />
                <span className="sr-only">{text.holdingsLabel}</span>
                {formatMoney(holdings.total, locale, currency)}
              </span>
            </Tooltip>
            {setupOpen ? (
              <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-pine px-4 text-sm font-medium text-white" aria-disabled="true">
                <Plus className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">{text.newMovement}</span>
              </span>
            ) : (
              <NewMovementButton label={text.newMovement} />
            )}
            {setupOpen ? (
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink/70 ring-1 ring-ink/10" aria-hidden>
                <Bell className="h-4 w-4" />
              </span>
            ) : (
              <Link href="/settings" prefetch={false} aria-label={text.navSettings} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink/70 ring-1 ring-ink/10">
                <Bell className="h-4 w-4" aria-hidden />
              </Link>
            )}
            {setupOpen ? (
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-pine text-white" aria-hidden>
                <UserRound className="h-4 w-4" />
              </span>
            ) : profile ? (
              <Suspense fallback={<span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-pine text-white"><UserRound className="h-4 w-4" aria-hidden /></span>}>
                <ProfileMenu name={name} text={text} profile={profile} error={profileError} />
              </Suspense>
            ) : (
              <Link href="/settings" prefetch={false} aria-label={name} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-pine text-white">
                <UserRound className="h-4 w-4" aria-hidden />
              </Link>
            )}
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 pb-36 lg:px-8 lg:pb-20">{children}</main>
      </div>
      <AppNav text={text} variant="bar" />
      <div className="fixed bottom-24 left-3 z-20 lg:hidden">
        <LanguageMenu locale={locale} label={text.language} next={`${path}${search}`} placement="up" />
      </div>
    </div>
  );
}
