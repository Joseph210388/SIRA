"use client";

import { setupPinAction, verifyMfaAction } from "@/lib/auth/actions";
import { TotpSetup } from "@/components/totp-setup";
import type { Copy } from "@/lib/i18n";
import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";

function isNextRedirect(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && String((error as { digest: unknown }).digest).includes("NEXT_REDIRECT");
}

function DigitRow({
  length,
  label,
  disabled,
  shake,
  onComplete,
}: {
  length: number;
  label: string;
  disabled: boolean;
  shake: boolean;
  onComplete: (code: string) => void;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [values, setValues] = useState<string[]>(() => Array.from({ length }, () => ""));

  function write(index: number, digit: string) {
    const next = values.map((value, place) => (place === index ? digit : value));
    setValues(next);
    if (digit && index < length - 1) refs.current[index + 1]?.focus();
    if (next.every((value) => value.length === 1)) onComplete(next.join(""));
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !values[index] && index > 0) {
      const next = [...values];
      next[index - 1] = "";
      setValues(next);
      refs.current[index - 1]?.focus();
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length).split("");
    if (digits.length === 0) return;
    event.preventDefault();
    const next = Array.from({ length }, (_, index) => digits[index] ?? "");
    setValues(next);
    if (next.every((value) => value.length === 1)) onComplete(next.join(""));
    else refs.current[digits.length]?.focus();
  }

  return (
    <div className={`grid gap-2 ${length === 6 ? "grid-cols-6" : "grid-cols-4"} ${shake ? "animate-shake motion-reduce:animate-none" : ""}`}>
      {values.map((value, index) => (
        <input
          key={index}
          ref={(node) => { refs.current[index] = node; }}
          value={value}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`${label} ${index + 1}`}
          autoFocus={index === 0}
          disabled={disabled}
          className="min-h-12 w-full rounded-2xl border border-[#E8DFC8] bg-[#FAF8F3] text-center text-lg text-[#14271F]"
          onPaste={onPaste}
          onKeyDown={(event) => onKeyDown(index, event)}
          onChange={(event) => {
            const digit = event.target.value.replace(/\D/g, "").slice(-1);
            write(index, digit);
          }}
        />
      ))}
    </div>
  );
}

export function PinGate({
  text,
  gate,
  factor,
}: {
  text: Copy;
  gate: "verify" | "setup";
  factor: "pin" | "totp";
}) {
  const busy = useRef(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<"code" | "locked" | "pin" | "database" | null>(null);
  const [shake, setShake] = useState(0);
  const [pending, setPending] = useState(false);
  const length = gate === "verify" && factor === "totp" ? 6 : 4;
  const message = error === "locked" ? text.errorLocked : error === "pin" ? text.errorPin : error === "database" ? text.errorDatabase : error ? text.errorCode : null;

  async function reveal(code: string) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError(null);
    const data = new FormData();
    data.set("code", code);
    try {
      const result = await verifyMfaAction(data);
      if (result && !result.ok) {
        setError(result.error);
        setShake((value) => value + 1);
        busy.current = false;
        setPending(false);
      }
    } catch (caught) {
      if (isNextRedirect(caught)) throw caught;
      setError("database");
      busy.current = false;
      setPending(false);
    }
  }

  async function createPin(confirm: string) {
    if (pin.length !== 4 || confirm.length !== 4) return;
    if (pin !== confirm) {
      setError("pin");
      setShake((value) => value + 1);
      setPin("");
      return;
    }
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    const data = new FormData();
    data.set("pin", pin);
    data.set("confirm", confirm);
    try {
      const result = await setupPinAction(data);
      if (result && !result.ok) {
        setError(result.error);
        setShake((value) => value + 1);
        setPin("");
        busy.current = false;
        setPending(false);
      }
    } catch (caught) {
      if (isNextRedirect(caught)) throw caught;
      setError("database");
      busy.current = false;
      setPending(false);
    }
  }

  return (
    <div className="grid gap-3">
      <h1 className="text-lg font-semibold text-[#14271F]">{text.securityTitle}</h1>
      <p className="text-xs leading-5 text-[#3F6756]">{length === 6 ? text.vaultCodeHint : text.vaultPinHint}</p>
      {message ? <p className="text-sm text-danger">{message}</p> : null}
      {gate === "verify" ? (
        <DigitRow key={shake} length={length} label={length === 6 ? text.code : text.pin} disabled={pending} shake={shake > 0} onComplete={reveal} />
      ) : (
        <div className="grid gap-3">
          <p className="text-sm font-medium">{text.pin}</p>
          <DigitRow key={`pin-${shake}`} length={4} label={text.pin} disabled={pending} shake={false} onComplete={setPin} />
          <p className="text-sm font-medium">{text.pinConfirm}</p>
          <DigitRow key={`confirm-${shake}`} length={4} label={text.pinConfirm} disabled={pending || pin.length !== 4} shake={shake > 0} onComplete={createPin} />
          <TotpSetup help={text.totpHelp} codeLabel={text.code} confirm={text.confirm} />
        </div>
      )}
    </div>
  );
}
