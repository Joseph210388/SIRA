import { VaultFrame } from "@/components/public-frame";
import { VaultUnlock } from "@/components/vault-unlock";
import { pendingFactor } from "@/lib/auth/actions";
import { getSession } from "@/lib/auth/session";
import { copy } from "@/lib/i18n";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const jar = await cookies();
  const text = copy(jar.get("sira_locale")?.value ?? "es");
  const params = await searchParams;
  const databaseReady = Boolean(process.env.DATABASE_URL);
  const session = await getSession().catch(() => null);
  let initialGate: "credentials" | "verify" | "setup" = "credentials";
  let initialFactor: "pin" | "totp" = "pin";
  if (session && !session.mfa) {
    const method = await pendingFactor(session.userId).catch(() => null);
    initialGate = method ? "verify" : "setup";
    initialFactor = method === "totp" ? "totp" : "pin";
  }
  const credentialError = params.error === "credentials" ? text.errorCredentials : params.error === "database" ? text.errorDatabase : undefined;
  return (
    <VaultFrame mode="login" text={text}>
      <VaultUnlock
        text={text}
        databaseReady={databaseReady}
        credentialError={credentialError}
        initialGate={initialGate}
        initialFactor={initialFactor}
      />
    </VaultFrame>
  );
}
