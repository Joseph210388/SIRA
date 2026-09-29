"use client";

import { Field, Select } from "@/components/field";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PinGate } from "@/components/pin-gate";
import { registerAction } from "@/lib/auth/actions";
import { countries } from "@/lib/countries";
import type { Copy } from "@/lib/i18n";
import Link from "next/link";
import { useState, type FormEvent } from "react";

const steps = [
  { title: "vaultStepAccess", names: ["email", "password", "confirm"] },
  { title: "vaultStepPerson", names: ["firstName", "lastName", "displayName", "phone", "birthDate"] },
  { title: "vaultStepPlace", names: ["country", "city", "locality", "terms"] },
] as const;

function fieldOf(form: HTMLFormElement, name: string) {
  const field = form.elements.namedItem(name);
  if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) return field;
  return null;
}

function filled(form: HTMLFormElement, name: string) {
  const field = fieldOf(form, name);
  if (!field) return false;
  if (field instanceof HTMLInputElement && field.type === "checkbox") return field.checked;
  return field.value.trim().length > 0;
}

function isNextRedirect(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && String((error as { digest: unknown }).digest).includes("NEXT_REDIRECT");
}

export function RegisterForm({ text, error, initialStep }: { text: Copy; error?: string; initialStep: number }) {
  const [step, setStep] = useState(initialStep);
  const [phase, setPhase] = useState<"form" | "out" | "pin">("form");
  const [pending, setPending] = useState(false);
  const last = step === steps.length - 1;

  function advance(form: HTMLFormElement) {
    for (const name of steps[step].names) {
      const field = fieldOf(form, name);
      if (!field) continue;
      if (field instanceof HTMLInputElement) field.setCustomValidity("");
      if (!field.checkValidity()) {
        field.reportValidity();
        return;
      }
    }
    const password = fieldOf(form, "password");
    const confirm = fieldOf(form, "confirm");
    if (step === 0 && password instanceof HTMLInputElement && confirm instanceof HTMLInputElement && password.value !== confirm.value) {
      confirm.setCustomValidity(text.errorPassword);
      confirm.reportValidity();
      return;
    }
    setStep((value) => Math.min(value + 1, steps.length - 1));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const missing = steps.findIndex((item) => item.names.some((name) => !filled(form, name)));
    if (missing >= 0) {
      setStep(missing);
      return;
    }
    setPending(true);
    try {
      const result = await registerAction(new FormData(form));
      if (result?.ok) {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPhase("pin");
        else {
          setPhase("out");
          window.setTimeout(() => setPhase("pin"), 450);
        }
        return;
      }
      setPending(false);
    } catch (caught) {
      if (isNextRedirect(caught)) throw caught;
      setPending(false);
    }
  }

  if (phase === "pin") {
    return (
      <div className="overflow-hidden">
        <div className="motion-safe:animate-slide-in">
          <PinGate text={text} gate="setup" factor="pin" />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
    <form onSubmit={onSubmit} className={`grid gap-3 ${phase === "out" ? "-translate-x-full transition-transform duration-500 ease-out motion-reduce:transition-none" : ""}`}>
      <div className="flex gap-1" aria-hidden>
        {steps.map((item, index) => (
          <span key={item.title} className={`h-1 flex-1 rounded-full ${index <= step ? "bg-pine" : "bg-pine/15"}`} />
        ))}
      </div>
      <p className="text-sm font-semibold">{text[steps[step].title]}</p>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {step === 0 ? <p className="text-xs leading-5 text-pine/80">{text.vaultContext}</p> : null}

      <div className={step === 0 ? "grid gap-3" : "hidden"}>
        <Field label={text.email}><Input name="email" type="email" required autoComplete="email" /></Field>
        <PasswordField label={text.password} name="password" hint={text.passwordHint} autoComplete="new-password" minLength={10} showLabel={text.showPassword} hideLabel={text.hidePassword} />
        <PasswordField label={text.passwordConfirm} name="confirm" autoComplete="new-password" minLength={10} showLabel={text.showPassword} hideLabel={text.hidePassword} />
      </div>
      <div className={step === 1 ? "grid gap-3" : "hidden"}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={text.firstName}><Input name="firstName" required autoComplete="given-name" /></Field>
          <Field label={text.lastName}><Input name="lastName" required autoComplete="family-name" /></Field>
        </div>
        <Field label={text.displayName} hint={text.displayNameHint}><Input name="displayName" required maxLength={40} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={text.phone}><Input name="phone" type="tel" required autoComplete="tel" /></Field>
          <Field label={text.birthDate}><Input name="birthDate" type="date" required /></Field>
        </div>
      </div>
      <div className={step === 2 ? "grid gap-3" : "hidden"}>
        <Field label={text.country}>
          <Select name="country" required defaultValue="ES">
            {countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={text.city}><Input name="city" required autoComplete="address-level2" /></Field>
          <Field label={text.locality}><Input name="locality" required /></Field>
        </div>
        <label className="flex min-h-11 items-start gap-2 text-sm">
          <input name="terms" type="checkbox" required className="mt-1 h-4 w-4 shrink-0" />
          <span>{text.terms}. <Link href="/terms" className="underline">{text.termsLink}</Link> · <Link href="/privacy" className="underline">{text.privacyLink}</Link></span>
        </label>
      </div>

      <div className="flex gap-2">
        {step > 0 ? (
          <Button type="button" variant="ghost" className="rounded-full" onClick={() => setStep((value) => value - 1)}>{text.vaultPrevious}</Button>
        ) : null}
        {last ? (
          <Button type="submit" disabled={pending} className="flex-1 rounded-full bg-pine hover:bg-pine-dark">{text.vaultCreate}</Button>
        ) : (
          <Button type="button" className="flex-1 rounded-full bg-pine hover:bg-pine-dark" onClick={(event) => { const form = event.currentTarget.form; if (form) advance(form); }}>{text.vaultNext}</Button>
        )}
      </div>
    </form>
    </div>
  );
}
