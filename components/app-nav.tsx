"use client";

import type { Copy } from "@/lib/i18n";
import { Home, Landmark, ArrowLeftRight, PieChart, Target, Users, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", key: "navHome", icon: Home },
  { href: "/accounts", key: "navAccounts", icon: Landmark },
  { href: "/movements", key: "navMovements", icon: ArrowLeftRight },
  { href: "/budgets", key: "navBudgets", icon: PieChart },
  { href: "/goals", key: "navGoals", icon: Target },
  { href: "/duo", key: "navDuo", icon: Users },
  { href: "/settings", key: "navSettings", icon: Settings },
] as const;

export function AppNav({ text, variant }: { text: Copy; variant: "side" | "bar" }) {
  const pathname = usePathname();
  if (variant === "bar") {
    return (
      <nav className="fixed inset-x-0 bottom-0 z-20 flex gap-1 overflow-x-auto border-t border-ink/10 bg-white px-2 py-2 lg:hidden">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-11 min-w-16 shrink-0 flex-col items-center justify-center rounded-2xl px-2 text-[0.7rem] ${active ? "bg-pine text-white" : "text-ink/70"}`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {text[item.key]}
            </Link>
          );
        })}
      </nav>
    );
  }
  return (
    <nav className="mt-6 grid gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-11 items-center gap-3 rounded-full px-3 text-sm ${active ? "bg-pine text-white" : "text-ink/80 hover:bg-mist"}`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {text[item.key]}
          </Link>
        );
      })}
    </nav>
  );
}
