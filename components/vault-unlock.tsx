"use client";

import { PinGate } from "@/components/pin-gate";
import { Field } from "@/components/field";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/lib/auth/actions";
import type { Copy } from "@/lib/i18n";
import Link from "next/link";
import { useState, type FormEvent } from "react";

function isNextRedirect(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && String((error as { digest: unknown }).digest).includes("NEXT_REDIRECT");
}

export function VaultUnlock({
  text,
  databaseReady,
  credentialError,
  initialGate,
  initialFactor,
}: {
  text: Copy;
  databaseReady: boolean;
  credentialError?: string;
  initialGate: "credentials" | "verify" | "setup";
  initialFactor: "pin" | "totp";
}) {
  const [gate, setGate] = useState<"verify" | "setup">(initialGate === "setup" ? "setup" : "verify");
  const [factor, setFactor] = useState(initialFactor);
  const [phase, setPhase] = useState<"form" | "out" | "pin">(initialGate === "credentials" ? "form" : "pin");
  const [pending, setPending] = useState(false);

  function openPin() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("pin");
      return;
    }
    setPhase("out");
    window.setTimeout(() => setPhase("pin"), 450);
  }

  async function onLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const result = await loginAction(new FormData(event.currentTarget));
      if (result?.ok) {
        setGate(result.gate);
        setFactor(result.factor);
        openPin();
        return;
      }
      setPending(false);
    } catch (error) {
      if (isNextRedirect(error)) throw error;
      setPending(false);
    }
  }

  return (
    <div className="overflow-hidden">
      {phase === "pin" ? (
        <div className="motion-safe:animate-slide-in">
          <PinGate text={text} gate={gate} factor={factor} />
        </div>
      ) : (
        <div className={phase === "out" ? "-translate-x-full transition-transform duration-500 ease-out motion-reduce:transition-none" : ""}>
          {!databaseReady ? <p className="mb-3 rounded-2xl bg-accent/20 px-3 py-2 text-sm">{text.dbMissing}</p> : null}
          {credentialError ? <p className="mb-3 text-sm text-danger">{credentialError}</p> : null}
          <p className="mb-3 text-xs leading-5 text-pine/80">{text.vaultContext}</p>
          <form onSubmit={onLogin} className="grid gap-3">
            <Field label={text.email}><Input name="email" type="email" autoComplete="username" required /></Field>
            <PasswordField label={text.password} name="password" autoComplete="current-password" showLabel={text.showPassword} hideLabel={text.hidePassword} />
            <Button type="submit" disabled={pending} className="mt-1 w-full rounded-full bg-pine hover:bg-pine-dark">{text.vaultOpen}</Button>
          </form>
          <Link href="/" className="mt-2 inline-flex min-h-11 items-center text-sm text-pine/80">{text.landingBack}</Link>
        </div>
      )}
    </div>
  );
}
