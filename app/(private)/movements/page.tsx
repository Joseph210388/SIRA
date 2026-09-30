import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Los movimientos viven en Cuentas. Esta ruta se queda para los enlaces antiguos.
export default async function MovementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value);
  }
  const search = query.toString();
  redirect(search ? `/accounts?${search}` : "/accounts");
}
