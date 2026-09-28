"use client";

import { createInviteAction } from "@/lib/finance/actions";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function InviteButton({ label, once }: { label: string; once: string }) {
  const [code, setCode] = useState<string | null>(null);

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        onClick={async () => {
          const result = await createInviteAction();
          setCode(result.code);
        }}
      >
        {label}
      </Button>
      {code ? (
        <p className="rounded-xl bg-mist px-3 py-3 text-center font-mono text-lg tracking-widest">
          {code}
          <span className="mt-1 block font-sans text-xs tracking-normal">{once}</span>
        </p>
      ) : null}
    </div>
  );
}
