"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";

// El formulario no vive en la página: se abre al pulsar y se cierra sin perder la lista.
export function FormDialog({
  label,
  title,
  closeLabel,
  openOnLoad = false,
  signal,
  triggerClassName,
  hideTrigger = false,
  children,
}: {
  label: string;
  title: string;
  closeLabel: string;
  openOnLoad?: boolean;
  signal?: string;
  triggerClassName?: string;
  hideTrigger?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(openOnLoad);
  const titleId = useId();

  useEffect(() => {
    if (openOnLoad) setOpen(true);
  }, [openOnLoad]);

  useEffect(() => {
    if (!signal) return;
    function onOpen(event: Event) {
      const detail = (event as CustomEvent<string>).detail;
      if (detail === signal) setOpen(true);
    }
    window.addEventListener("sira-open-form", onOpen);
    return () => window.removeEventListener("sira-open-form", onOpen);
  }, [signal]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {hideTrigger ? null : (
        <Button type="button" className={triggerClassName ?? "w-full sm:w-auto"} onClick={() => setOpen(true)}>
          {label}
        </Button>
      )}
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 sm:items-center sm:p-4"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="grid max-h-[calc(100dvh-2rem)] w-full max-w-xl gap-4 overflow-y-auto rounded-[1.75rem] bg-paper p-4 shadow-[0_16px_50px_rgba(8,28,21,0.18)] sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id={titleId} className="text-title font-semibold">
                {title}
              </h2>
              <button
                type="button"
                aria-label={closeLabel}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ink ring-1 ring-ink/10"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            {children}
          </section>
        </div>
      ) : null}
    </>
  );
}
