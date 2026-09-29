"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function VaultTabs({
  mode,
  unlock,
  create,
}: {
  mode: "login" | "register";
  unlock: string;
  create: string;
}) {
  const [busy, setBusy] = useState(false);
  const tab = "inline-flex min-h-11 items-center justify-center rounded-full px-2 text-center text-sm font-semibold";

  useEffect(() => {
    setBusy(false);
  }, [mode]);

  useEffect(() => {
    if (!busy) return;
    const timer = window.setTimeout(() => setBusy(false), 12000);
    return () => window.clearTimeout(timer);
  }, [busy]);

  function leave(next: "login" | "register") {
    return (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (next === mode || busy) {
        event.preventDefault();
        return;
      }
      setBusy(true);
    };
  }

  return (
    <div className={`mb-4 grid grid-cols-2 gap-1 rounded-full bg-pine/5 p-1 ${busy ? "pointer-events-none opacity-80" : ""}`}>
      <Link href="/login" prefetch={false} onClick={leave("login")} className={`${tab} ${mode === "login" ? "bg-pine text-white" : "text-pine"}`}>
        {unlock}
      </Link>
      <Link href="/register" prefetch={false} onClick={leave("register")} className={`${tab} ${mode === "register" ? "bg-pine text-white" : "text-pine"}`}>
        {create}
      </Link>
    </div>
  );
}
