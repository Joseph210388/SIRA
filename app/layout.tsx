import { ChunkReload } from "@/components/chunk-reload";
import { LanguageCorner } from "@/components/language-corner";
import { ServiceWorker } from "@/components/service-worker";
import { getSession } from "@/lib/auth/session";
import { copy } from "@/lib/i18n";
import { isTheme, themeCookieName, themeVarsFor } from "@/lib/theme";
import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIRA",
  description: "Ingresos, gastos y ahorro",
  applicationName: "SIRA",
  appleWebApp: { capable: true, title: "SIRA", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#1f7a4d",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const jar = await cookies();
  const lang = jar.get("sira_locale")?.value ?? "es";
  const text = copy(lang);
  const session = await getSession().catch(() => null);
  const path = (await headers()).get("x-sira-path") ?? "/";
  const fromCookie = jar.get(themeCookieName)?.value;
  const theme = session && isTheme(session.theme) ? session.theme : isTheme(fromCookie) ? fromCookie : "emerald";
  const themeStyle = await themeVarsFor(theme);
  return (
    <html lang={lang} data-theme={theme} style={themeStyle ?? undefined}>
      <body>
        {session?.mfa ? null : <LanguageCorner locale={lang} label={text.language} next={path} />}
        <ChunkReload />
        <ServiceWorker />
        {children}
      </body>
    </html>
  );
}
