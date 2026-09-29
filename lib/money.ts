const localeTags = {
  es: "es-ES",
  en: "en-GB",
  it: "it-IT",
  fr: "fr-FR",
  de: "de-DE",
} as const;

export type AppLocale = keyof typeof localeTags;

export function moneyLocale(locale: string) {
  if (locale in localeTags) {
    return localeTags[locale as AppLocale];
  }
  return localeTags.es;
}

export function parseAmountToMinor(raw: string) {
  const normalized = raw.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  const [whole, fraction = ""] = normalized.split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(minor) || minor < 0) {
    return null;
  }
  return minor;
}

export function formatMoney(minor: number, locale: string, currency = "EUR") {
  return new Intl.NumberFormat(moneyLocale(locale), {
    style: "currency",
    currency,
  }).format(minor / 100);
}

export function ageInYears(birth: string, today = new Date()) {
  const [year, month, day] = birth.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }
  let age = today.getUTCFullYear() - year;
  const monthDelta = today.getUTCMonth() + 1 - month;
  if (monthDelta < 0 || (monthDelta === 0 && today.getUTCDate() < day)) {
    age -= 1;
  }
  return age;
}
