import { logoutAction } from "@/lib/auth/actions";
import { AppNav } from "@/components/app-nav";
import { HeaderSearch } from "@/components/header-search";
import { LanguageCorner } from "@/components/language-corner";
import { Button } from "@/components/ui/button";
import type { Copy } from "@/lib/i18n";
import { moneyLocale } from "@/lib/money";
import { ModeSwitch } from "@/components/mode-switch";
import { Plus } from "lucide-react";
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
  children,
}: {
  text: Copy;
  name: string;
  locale: string;
  timeZone: string;
  theme: string;
  children: ReactNode;
}) {
  const month = new Intl.DateTimeFormat(moneyLocale(locale), { month: "long", year: "numeric", timeZone }).format(new Date());
  const path = (await headers()).get("x-sira-path") ?? "/";
  return (
    <div data-theme={theme} className="min-h-dvh bg-paper text-ink lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="hidden border-ink/10 bg-white px-4 py-6 lg:flex lg:min-h-dvh lg:flex-col lg:border-r">
        <p className="text-lg font-semibold tracking-wide text-pine">{text.appName}</p>
        <p className="text-[0.65rem] uppercase tracking-[0.14em] text-ink/60">{text.brandLine}</p>
        <AppNav text={text} variant="side" />
        <div className="mt-auto grid gap-3 pt-6">
          <ModeSwitch text={text} />
          <p className="truncate text-sm text-ink/70">{name}</p>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost">{text.logout}</Button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-8">
          <p className="min-w-0 text-sm font-medium capitalize text-ink/80">{month}</p>
          <Suspense fallback={<div className="min-h-11 w-full sm:max-w-md sm:flex-1" />}>
            <HeaderSearch placeholder={text.searchPlaceholder} />
          </Suspense>
          <span className="rounded-full bg-white px-3 py-2 text-xs font-medium ring-1 ring-ink/10">{text.currencyEur}</span>
          <Link href="/movements" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-pine px-4 text-sm font-medium text-white">
            <Plus className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{text.newMovement}</span>
          </Link>
        </header>
        <main className="min-w-0 flex-1 px-4 pb-36 lg:px-8 lg:pb-20">{children}</main>
      </div>
      <AppNav text={text} variant="bar" />
      <LanguageCorner locale={locale} label={text.language} next={path} lift />
    </div>
  );
}
