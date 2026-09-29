import { redirect } from "next/navigation";

// La ruta de vuelta a veces ya trae ?step=. Un segundo ? deja una dirección que el navegador no abre.
export function redirectWithError(path: string, code: string): never {
  const url = new URL(path, "http://sira.local");
  url.searchParams.set("error", code);
  redirect(`${url.pathname}${url.search}`);
}
