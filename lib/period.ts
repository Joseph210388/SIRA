// Fechas de calendario en la zona de la persona. El mes en curso es el rango por defecto.

const dayPattern = /^\d{4}-\d{2}-\d{2}$/;

export type DayPeriod = {
  from: string;
  to: string;
  wholeMonth: boolean;
};

export function zonedToUtc(localValue: string, timeZone: string) {
  const asUtc = new Date(`${localValue}:00Z`);
  if (Number.isNaN(asUtc.getTime())) return null;
  const utcTime = new Date(asUtc.toLocaleString("en-US", { timeZone: "UTC" })).getTime();
  const zoneTime = new Date(asUtc.toLocaleString("en-US", { timeZone })).getTime();
  return new Date(asUtc.getTime() - (zoneTime - utcTime));
}

function isRealDay(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function calendarDay(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function monthPeriod(timeZone: string, anchor = new Date()) {
  const [year, month] = calendarDay(anchor, timeZone).split("-");
  const last = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  return {
    from: `${year}-${month}-01`,
    to: `${year}-${month}-${String(last).padStart(2, "0")}`,
  };
}

export function parsePeriod(fromRaw: string | undefined, toRaw: string | undefined, timeZone: string): DayPeriod {
  const current = monthPeriod(timeZone);
  if (!fromRaw || !toRaw || !dayPattern.test(fromRaw) || !dayPattern.test(toRaw) || !isRealDay(fromRaw) || !isRealDay(toRaw) || fromRaw > toRaw) {
    return { ...current, wholeMonth: true };
  }
  return {
    from: fromRaw,
    to: toRaw,
    wholeMonth: fromRaw === current.from && toRaw === current.to,
  };
}

export function nextDay(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + 1));
  const monthText = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dayText = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${monthText}-${dayText}`;
}

export function periodInstants(period: { from: string; to: string }, timeZone: string) {
  const start = zonedToUtc(`${period.from}T00:00`, timeZone);
  const end = zonedToUtc(`${nextDay(period.to)}T00:00`, timeZone);
  if (!start || !end) return null;
  return { start, end };
}

export function inPeriod(date: Date, period: { from: string; to: string }, timeZone: string) {
  const day = calendarDay(date, timeZone);
  return day >= period.from && day <= period.to;
}

export function formatDay(iso: string, locale: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatPeriodLabel(period: DayPeriod, locale: string, wholeMonthText: string) {
  if (period.wholeMonth) return wholeMonthText;
  if (period.from === period.to) return formatDay(period.from, locale);
  return `${formatDay(period.from, locale)} – ${formatDay(period.to, locale)}`;
}
