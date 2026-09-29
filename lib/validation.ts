// Cada campo acepta solo lo que le toca. La consulta sigue yendo con parámetros:
// esto no sustituye a Drizzle, evita que entre texto que no es un nombre o un importe.

const namePattern = /^[\p{L}\p{N} .,'’\-]+$/u;

export function cleanLabel(raw: string, max: number) {
  const value = raw.trim();
  if (value.length < 1 || value.length > max || !namePattern.test(value)) {
    return null;
  }
  return value;
}

export function cleanConcept(raw: string) {
  const value = raw.trim();
  if (value.length < 2 || value.length > 80 || !namePattern.test(value)) {
    return null;
  }
  return value;
}

export function cleanEmail(raw: string) {
  const value = raw.trim().toLowerCase();
  if (value.length < 6 || value.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return null;
  }
  return value;
}

export function allowedNext(raw: string, fallback: string) {
  if (raw === "/accounts" || raw === "/" || raw === "/settings" || raw === "/setup?step=categories" || raw === "/setup?step=theme") {
    return raw;
  }
  return fallback;
}
