import { logoutAction } from "@/lib/auth/actions";
import { AppNav } from "@/components/app-nav";
import { HeaderSearch } from "@/components/header-search";
import { LanguageCorner } from "@/components/language-corner";
import { Button } from "@/components/ui/button";
import type { Copy } from "@/lib/i18n";
import { moneyLocale } from "@/lib/money";
import { ModeSwitch } from "@/components/mode-switch";
import { Bell, Calendar, Plus, UserRound } from "lucide-react";
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
  setupOpen,
  children,
}: {
  text: Copy;
  name: string;
  locale: string;
  timeZone: string;
  theme: string;
  currency: string;
  setupOpen: boolean;
  children: ReactNode;
}) {
  const month = new Intl.DateTimeFormat(moneyLocale(locale), { month: "long", year: "numeric", timeZone }).format(new Date());
  const path = (await headers()).get("x-sira-path") ?? "/";
  return (
    <div data-theme={theme} className="min-h-dvh bg-paper text-ink lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
      <aside className="sticky top-4 z-20 mx-3 mt-4 mb-4 hidden h-fit max-h-[calc(100dvh-2rem)] flex-col overflow-y-auto rounded-[1.75rem] bg-white px-4 py-5 shadow-[0_8px_30px_rgba(20,39,31,0.06)] ring-1 ring-ink/10 lg:flex">
        <p className="text-lg font-semibold tracking-wide text-pine">{text.appName}</p>
        <p className="text-[0.65rem] uppercase tracking-[0.14em] text-ink/60">{text.brandLine}</p>
        <AppNav text={text} variant="side" />
        <div className="grid gap-3 pt-6">
          <ModeSwitch text={text} />
          <p className="truncate text-sm text-ink/70">{name}</p>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost">{text.logout}</Button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex flex-wrap items-center gap-2 bg-paper/95 px-4 py-3 backdrop-blur sm:gap-3 lg:px-8">
          <p className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white px-3 text-sm font-medium capitalize text-ink/80 ring-1 ring-ink/10">
            <Calendar className="h-4 w-4 shrink-0 text-ink/50" aria-hidden />
            {month}
          </p>
          <Suspense fallback={<div className="min-h-11 w-full sm:max-w-xl sm:flex-1" />}>
            <HeaderSearch placeholder={text.searchPlaceholder} locked={setupOpen} />
          </Suspense>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-3 text-sm font-medium ring-1 ring-ink/10">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-600" aria-hidden />
              {currency}
            </span>
            {setupOpen ? (
              <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-pine px-4 text-sm font-medium text-white" aria-disabled="true">
                <Plus className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">{text.newMovement}</span>
              </span>
            ) : (
              <Link href="/movements" prefetch={false} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-pine px-4 text-sm font-medium text-white">
                <Plus className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">{text.newMovement}</span>
              </Link>
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
      <LanguageCorner locale={locale} label={text.language} next={path} lift />
    </div>
  );
}
