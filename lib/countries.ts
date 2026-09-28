export const countries = [
  { code: "ES", name: "España" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Deutschland" },
  { code: "IT", name: "Italia" },
  { code: "AT", name: "Österreich" },
  { code: "GB", name: "United Kingdom" },
  { code: "IE", name: "Ireland" },
  { code: "BE", name: "België / Belgique" },
  { code: "NL", name: "Nederland" },
  { code: "PT", name: "Portugal" },
  { code: "US", name: "United States" },
] as const;

const zones: Record<string, string> = {
  ES: "Europe/Madrid",
  FR: "Europe/Paris",
  DE: "Europe/Berlin",
  IT: "Europe/Rome",
  AT: "Europe/Vienna",
  GB: "Europe/London",
  IE: "Europe/Dublin",
  BE: "Europe/Brussels",
  NL: "Europe/Amsterdam",
  PT: "Europe/Lisbon",
  US: "America/New_York",
};

export function timezoneForCountry(code: string) {
  return zones[code] ?? "Europe/Madrid";
}

export const timezones = [
  "Europe/Madrid",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/London",
  "America/New_York",
] as const;
