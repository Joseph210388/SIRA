import { getSession } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";
import { appCopy } from "@/lib/i18n-db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function PrivateLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  const path = (await headers()).get("x-sira-path");
  if (!session) {
    if (path === "/") return children;
    redirect("/login");
  }
  if (!session.mfa) {
    return <main className="mx-auto grid min-h-dvh w-full max-w-lg content-start gap-4 px-4 pb-8 pt-16">{children}</main>;
  }
  const text = await appCopy(session.locale);
  return (
    <AppShell text={text} name={session.displayName} locale={session.locale} timeZone={session.timezone} theme={session.theme}>
      {children}
    </AppShell>
  );
}
