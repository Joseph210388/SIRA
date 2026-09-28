"use client";

import { confirmTotpAction, startTotpAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function TotpSetup({ help, codeLabel, confirm }: { help: string; codeLabel: string; confirm: string }) {
  const [data, setData] = useState<{ secret: string; qr: string } | null>(null);

  return (
    <div className="grid gap-3">
      <Button type="button" variant="ghost" onClick={async () => setData(await startTotpAction())}>
        Google Authenticator
      </Button>
      {data ? (
        <form action={confirmTotpAction} className="grid gap-3">
          <p className="text-sm text-ink/80">{help}</p>
          <img src={data.qr} alt="" className="h-auto max-w-40" />
          <p className="break-all font-mono text-sm">{data.secret}</p>
          <Input name="code" inputMode="numeric" autoComplete="one-time-code" required aria-label={codeLabel} />
          <Button type="submit">{confirm}</Button>
        </form>
      ) : null}
    </div>
  );
}
