"use client";

import { moneyLocale } from "@/lib/money";
import { formatPeriodLabel, monthPeriod, parsePeriod } from "@/lib/period";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

function monthCells(cursor: string) {
  const [year, month] = cursor.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const pad = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: Array<string | null> = Array.from({ length: pad }, () => null);
  for (let day = 1; day <= count; day += 1) {
    cells.push(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
  return cells;
}

function shiftMonth(cursor: string, step: number) {
  const [year, month] = cursor.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + step, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthTitle(cursor: string, locale: string) {
  const [year, month] = cursor.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
}

// El primer toque marca un día. El segundo, si es otro día, abre el intervalo.
export function PeriodPicker({
  locale,
  timeZone,
  wholeMonth,
  applyLabel,
  previousLabel,
  nextLabel,
}: {
  locale: string;
  timeZone: string;
  wholeMonth: string;
  applyLabel: string;
  previousLabel: string;
  nextLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const tag = moneyLocale(locale);
  const period = parsePeriod(search.get("from") ?? undefined, search.get("to") ?? undefined, timeZone);
  const label = formatPeriodLabel(period, tag, wholeMonth);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const [from, setFrom] = useState(period.from);
  const [to, setTo] = useState(period.to);
  const [picking, setPicking] = useState(false);
  const [cursor, setCursor] = useState(period.from.slice(0, 7));
  const weekdays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(tag, { weekday: "narrow", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 1 + index))));
  }, [tag]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointer(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  function choose(day: string) {
    if (!picking) {
      setFrom(day);
      setTo(day);
      setPicking(true);
      return;
    }
    if (day < from) {
      setTo(from);
      setFrom(day);
    } else {
      setTo(day);
    }
    setPicking(false);
  }

  function apply(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams(search.toString());
    params.delete("page");
    const current = monthPeriod(timeZone);
    if (nextFrom === current.from && nextTo === current.to) {
      params.delete("from");
      params.delete("to");
    } else {
      params.set("from", nextFrom);
      params.set("to", nextTo);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    setOpen(false);
  }

  const cells = monthCells(cursor);
  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-2xl bg-white px-3 text-sm font-medium text-ink/80 ring-1 ring-ink/10"
        onClick={() => {
          setFrom(period.from);
          setTo(period.to);
          setCursor(period.from.slice(0, 7));
          setPicking(false);
          setOpen((value) => !value);
        }}
      >
        <Calendar className="h-4 w-4 shrink-0 text-ink/50" aria-hidden />
        <span className="truncate">{label}</span>
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-40 grid w-[min(22rem,calc(100vw-1.5rem))] gap-3 rounded-[1.75rem] bg-white p-4 text-ink shadow-[0_16px_50px_rgba(8,28,21,0.16)] ring-1 ring-ink/10">
          <div className="flex items-center justify-between gap-2">
            <button type="button" aria-label={previousLabel} className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-mist" onClick={() => setCursor(shiftMonth(cursor, -1))}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <p className="text-sm font-medium capitalize">{monthTitle(cursor, tag)}</p>
            <button type="button" aria-label={nextLabel} className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-mist" onClick={() => setCursor(shiftMonth(cursor, 1))}>
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[0.7rem] text-ink/50">
            {weekdays.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, index) => {
              if (!day) return <span key={`empty-${index}`} />;
              const selected = day >= from && day <= to;
              const edge = day === from || day === to;
              return (
                <button
                  key={day}
                  type="button"
                  className={`flex min-h-11 items-center justify-center rounded-xl text-sm ${edge ? "bg-pine text-white" : selected ? "bg-mist text-ink" : "hover:bg-mist"}`}
                  onClick={() => choose(day)}
                >
                  {Number(day.slice(-2))}
                </button>
              );
            })}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="min-h-11 rounded-xl bg-mist px-3 text-sm font-medium"
              onClick={() => {
                const current = monthPeriod(timeZone);
                apply(current.from, current.to);
              }}
            >
              {wholeMonth}
            </button>
            <button type="button" className="min-h-11 rounded-xl bg-pine px-3 text-sm font-medium text-white" onClick={() => apply(from, to)}>
              {applyLabel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
