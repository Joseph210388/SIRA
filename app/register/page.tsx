import { VaultFrame } from "@/components/public-frame";
import { RegisterForm } from "@/components/register-form";
import { copy } from "@/lib/i18n";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const errors: Record<string, "errorPassword" | "errorAge" | "errorTerms" | "errorEmail" | "errorDatabase" | "errorGeneric"> = {
  password: "errorPassword",
  age: "errorAge",
  terms: "errorTerms",
  email: "errorEmail",
  database: "errorDatabase",
  generic: "errorGeneric",
};

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const jar = await cookies();
  const text = copy(jar.get("sira_locale")?.value ?? "es");
  const params = await searchParams;
  const errorKey = params.error ? errors[params.error] : undefined;
  const initialStep = params.error === "age" ? 1 : params.error === "terms" ? 2 : 0;
  return (
    <VaultFrame mode="register" text={text}>
      <RegisterForm text={text} error={errorKey ? text[errorKey] : undefined} initialStep={initialStep} />
    </VaultFrame>
  );
}
