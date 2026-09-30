"use client";

import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logoutAction, saveProfileAction } from "@/lib/auth/actions";
import type { OwnProfile } from "@/lib/auth/profile";
import type { Copy } from "@/lib/i18n";
import { LogOut, Settings, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

export function ProfileMenu({
  name,
  text,
  profile,
  error,
}: {
  name: string;
  text: Copy;
  profile: OwnProfile;
  error: string | null;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const titleId = useId();
  const [menu, setMenu] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState(error !== null);
  const next = `${pathname}${search.toString() ? `?${search}` : ""}`;
  const notice = error === "age" ? text.errorAge : error === "generic" ? text.errorGeneric : error ? text.errorDatabase : null;

  useEffect(() => {
    if (!menu && !editor) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenu(false);
        setEditor(false);
      }
    }
    function onPointer(event: MouseEvent) {
      if (menu && !root.current?.contains(event.target as Node)) setMenu(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [menu, editor]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={menu}
        aria-haspopup="menu"
        aria-label={name}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-pine text-white"
        onClick={() => setMenu((value) => !value)}
      >
        <UserRound className="h-4 w-4" aria-hidden />
      </button>
      {menu ? (
        <div role="menu" className="absolute right-0 top-[calc(100%+0.5rem)] z-40 grid w-[min(16rem,calc(100vw-2rem))] gap-1 rounded-3xl bg-white p-2 text-ink shadow-[0_12px_40px_rgba(20,39,31,0.12)] ring-1 ring-ink/10">
          <p className="truncate px-3 py-2 text-sm font-medium">{name}</p>
          <button
            type="button"
            role="menuitem"
            className="flex min-h-11 items-center gap-3 rounded-2xl px-3 text-left text-sm hover:bg-mist"
            onClick={() => {
              setMenu(false);
              setEditor(true);
            }}
          >
            <UserRound className="h-4 w-4 shrink-0" aria-hidden />
            {text.viewProfile}
          </button>
          <Link href="/settings" role="menuitem" className="flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm hover:bg-mist" onClick={() => setMenu(false)}>
            <Settings className="h-4 w-4 shrink-0" aria-hidden />
            {text.navSettings}
          </Link>
          <form action={logoutAction}>
            <button type="submit" role="menuitem" className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm hover:bg-mist">
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
              {text.logout}
            </button>
          </form>
        </div>
      ) : null}
      {editor ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 sm:items-center sm:p-4" role="presentation" onClick={() => setEditor(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="grid max-h-[calc(100dvh-2rem)] w-full max-w-xl gap-4 overflow-y-auto rounded-[1.75rem] bg-paper p-4 shadow-[0_16px_50px_rgba(8,28,21,0.18)] sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id={titleId} className="text-title font-semibold">{text.profileTitle}</h2>
              <button type="button" aria-label={text.close} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ink ring-1 ring-ink/10" onClick={() => setEditor(false)}>
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            {notice ? <p className="text-sm text-danger">{notice}</p> : null}
            <form action={saveProfileAction} className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
              <input type="hidden" name="next" value={next} />
              <Field label={text.email}><Input defaultValue={profile.email} readOnly /></Field>
              <Field label={text.displayName} hint={text.displayNameHint}><Input name="displayName" required maxLength={40} defaultValue={profile.displayName} /></Field>
              <Field label={text.firstName}><Input name="firstName" required maxLength={40} defaultValue={profile.firstName} /></Field>
              <Field label={text.lastName}><Input name="lastName" required maxLength={40} defaultValue={profile.lastName} /></Field>
              <Field label={text.phone}><Input name="phone" required maxLength={20} defaultValue={profile.phone} /></Field>
              <Field label={text.city}><Input name="city" required maxLength={60} defaultValue={profile.city} /></Field>
              <Field label={text.locality}><Input name="locality" required maxLength={60} defaultValue={profile.locality} /></Field>
              <Field label={text.birthDate}><Input name="birthDate" type="date" required defaultValue={profile.birthDate} /></Field>
              <Button type="submit">{text.save}</Button>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
