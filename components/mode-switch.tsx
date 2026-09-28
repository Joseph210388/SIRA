"use client";

import type { Copy } from "@/lib/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function ModeSwitch({ text }: { text: Pick<Copy, "personalMode" | "navDuo"> }) {
  const pathname = usePathname();
  const duo = pathname.startsWith("/duo");
  return (
    <div className="grid grid-cols-2 gap-1 rounded-full bg-mist p-1 text-center text-xs">
      <Link href="/" className={`flex min-h-11 items-center justify-center rounded-full ${duo ? "text-ink/70" : "bg-white font-medium"}`}>{text.personalMode}</Link>
      <Link href="/duo" className={`flex min-h-11 items-center justify-center rounded-full ${duo ? "bg-white font-medium" : "text-ink/70"}`}>{text.navDuo}</Link>
    </div>
  );
}
