"use server";

import { createSession, currentToken, markMfaVerified } from "@/lib/auth/session";
import { countries, timezoneForCountry } from "@/lib/countries";
import { asBuffer, decryptString, encryptString, randomId, sha256 } from "@/lib/crypto";
import { assumeUser, withDatabase } from "@/lib/db/client";
import {
  legalAcceptances,
  mfaRecoveryCodes,
  profiles,
  reminderSettings,
  userMfa,
  users,
} from "@/lib/db/schema";
import { isLocale } from "@/lib/i18n";
import { isTheme, themeCookie } from "@/lib/theme";
import { ageInYears } from "@/lib/money";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Secret, TOTP } from "otpauth";
import bcrypt from "bcryptjs";

const termsVersion = "2026-09-28";
function fail(path: string, code: string): never {
  redirect(`${path}?error=${code}`);
}

function isRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")
  );
}

function isUnique(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "23505";
}

function safeNext(value: string) {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/";
  }
  return value;
}

function localeCookie(locale: string) {
  return {
    name: "sira_locale" as const,
    value: locale,
    options: { path: "/", sameSite: "lax" as const, maxAge: 60 * 60 * 24 * 365 },
  };
}

export async function setLocaleAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "es");
  const next = safeNext(String(formData.get("next") ?? "/"));
  if (!isLocale(locale)) {
    return;
  }
  const { getSession } = await import("@/lib/auth/session");
  const session = await getSession().catch(() => null);
  if (session) {
    try {
      await withDatabase(async (db, client) => {
        await assumeUser(client, session.userId);
        await db.update(users).set({ locale }).where(eq(users.id, session.userId));
      });
    } catch (error) {
      if (isRedirect(error)) throw error;
      fail(next.split("?")[0] || "/", "database");
    }
  }
  const jar = await cookies();
  const cookie = localeCookie(locale);
  jar.set(cookie.name, cookie.value, cookie.options);
  redirect(next);
}

export async function registerAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const country = String(formData.get("country") ?? "");
  const city = String(formData.get("city") ?? "").trim();
  const locality = String(formData.get("locality") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const birthDate = String(formData.get("birthDate") ?? "");
  const accepted = formData.get("terms") === "on";

  if (!accepted) fail("/register", "terms");
  if (password.length < 10 || password !== confirm) fail("/register", "password");
  if (!email.includes("@") || firstName.length < 1 || lastName.length < 1) fail("/register", "generic");
  if (displayName.length < 1 || displayName.length > 40) fail("/register", "generic");
  if (!countries.some((item) => item.code === country)) fail("/register", "age");
  if (city.length < 1 || locality.length < 1 || phone.length < 6) fail("/register", "generic");
  const age = ageInYears(birthDate);
  if (age === null) fail("/register", "age");

  const userId = randomId();
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    await withDatabase(async (db, client) => {
      const rule = await client.query<{ minimum_age: number }>(
        "select minimum_age from country_age_rules where country_code = $1",
        [country],
      );
      const minimum = rule.rows[0]?.minimum_age;
      if (!minimum || age < minimum) {
        fail("/register", "age");
      }
      await assumeUser(client, userId);
      await db.insert(users).values({
        id: userId,
        email,
        passwordHash,
        countryCode: country,
        locale: "es",
        timezone: timezoneForCountry(country),
        firstNameCiphertext: encryptString(firstName),
        lastNameCiphertext: encryptString(lastName),
        phoneCiphertext: encryptString(phone),
        cityCiphertext: encryptString(city),
        localityCiphertext: encryptString(locality),
        birthDateCiphertext: encryptString(birthDate),
      });
      await db.insert(profiles).values({ userId, displayName });
      await db.insert(legalAcceptances).values({
        userId,
        countryCode: country,
        minimumAge: minimum,
        termsVersion,
        privacyVersion: termsVersion,
      });
      await db.insert(userMfa).values({ userId });
      await db.insert(reminderSettings).values({ userId, enabled: false, localTime: "19:30:00" });
    });
  } catch (error) {
    if (isUnique(error)) fail("/register", "email");
    if (isRedirect(error)) throw error;
    console.error("registerAction", error instanceof Error ? error.message : "database");
    fail("/register", "database");
  }
  await createSession(userId, false);
  const jar = await cookies();
  const cookie = localeCookie("es");
  jar.set(cookie.name, cookie.value, cookie.options);
  const theme = themeCookie("emerald");
  jar.set(theme.name, theme.value, theme.options);
  return { ok: true as const };
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  try {
    const found = await withDatabase(async (_db, client) => {
      const result = await client.query<{ user_id: string; password_hash: string }>(
        "select user_id, password_hash from sira_private.lookup_login($1::citext)",
        [email],
      );
      return result.rows[0] ?? null;
    });
    const hash = found?.password_hash ?? (await bcrypt.hash("sira-missing-user", 12));
    const matches = await bcrypt.compare(password, hash);
    if (!found || !matches) fail("/login", "credentials");
    const [person] = await withDatabase(async (db, client) => {
      await assumeUser(client, found.user_id);
      return db.select({ locale: users.locale, theme: users.theme }).from(users).where(eq(users.id, found.user_id)).limit(1);
    });
    const storedLocale = person && isLocale(person.locale) ? person.locale : "es";
    const storedTheme = person && isTheme(person.theme) ? person.theme : "emerald";
    await createSession(found.user_id, false);
    const jar = await cookies();
    const cookie = localeCookie(storedLocale);
    jar.set(cookie.name, cookie.value, cookie.options);
    const theme = themeCookie(storedTheme);
    jar.set(theme.name, theme.value, theme.options);
    const method = await pendingFactor(found.user_id);
    return {
      ok: true as const,
      gate: method ? ("verify" as const) : ("setup" as const),
      factor: method === "totp" ? ("totp" as const) : ("pin" as const),
    };
  } catch (error) {
    if (isRedirect(error)) throw error;
    fail("/login", "database");
  }
}

export async function logoutAction() {
  const { clearSession } = await import("@/lib/auth/session");
  await clearSession();
  redirect("/login");
}

export async function setupPinAction(formData: FormData) {
  const pin = String(formData.get("pin") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const token = await currentToken();
  if (!token) fail("/login", "credentials");
  if (!/^\d{4}$/.test(pin) || pin !== confirm) return { ok: false as const, error: "pin" as const };
  const pinHash = await bcrypt.hash(pin, 12);
  try {
    await withDatabase(async (db, client) => {
      await assumeUser(client, token.userId);
      await db.update(userMfa).set({ method: "pin", pinHash, pinFailedAttempts: 0, pinLockedUntil: null }).where(eq(userMfa.userId, token.userId));
    });
    await markMfaVerified(token);
  } catch (error) {
    if (isRedirect(error)) throw error;
    return { ok: false as const, error: "database" as const };
  }
  redirect("/");
}

export async function startTotpAction() {
  const token = await currentToken();
  if (!token) fail("/login", "credentials");
  const secret = new Secret({ size: 20 });
  const totp = new TOTP({
    issuer: "SIRA",
    label: "SIRA",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });
  const url = totp.toString();
  const qr = await import("qrcode").then((mod) => mod.default.toDataURL(url));
  const jar = await cookies();
  jar.set("sira_totp_setup", encryptString(secret.base32).toString("base64url"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return { url, secret: secret.base32, qr };
}

export async function confirmTotpAction(formData: FormData) {
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  const token = await currentToken();
  if (!token) fail("/login", "credentials");
  const jar = await cookies();
  const pending = jar.get("sira_totp_setup")?.value;
  if (!pending) fail("/login", "code");
  const secret = decryptString(Buffer.from(pending, "base64url"));
  const totp = new TOTP({ issuer: "SIRA", label: "SIRA", algorithm: "SHA1", digits: 6, period: 30, secret: Secret.fromBase32(secret) });
  if (totp.validate({ token: code, window: 1 }) === null) fail("/login", "code");
  const plainCodes = Array.from({ length: 8 }, () => randomId().slice(0, 10));
  try {
    await withDatabase(async (db, client) => {
      await assumeUser(client, token.userId);
      await db.update(userMfa).set({
        method: "totp",
        totpSecretCiphertext: encryptString(secret),
        totpConfirmedAt: new Date(),
        pinHash: null,
      }).where(eq(userMfa.userId, token.userId));
      await db.insert(mfaRecoveryCodes).values(plainCodes.map((value) => ({ userId: token.userId, codeHash: sha256(value) })));
    });
    jar.set("sira_totp_setup", "", { path: "/", maxAge: 0 });
    await markMfaVerified(token);
  } catch (error) {
    if (isRedirect(error)) throw error;
    fail("/login", "database");
  }
  jar.set("sira_recovery_once", plainCodes.join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 120,
  });
  redirect("/");
}

export async function verifyMfaAction(formData: FormData) {
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  const token = await currentToken();
  if (!token) fail("/login", "credentials");
  try {
    const status = await withDatabase(async (db, client) => {
      await assumeUser(client, token.userId);
      const [row] = await db.select().from(userMfa).where(eq(userMfa.userId, token.userId)).limit(1);
      if (!row?.method) return "bad" as const;
      if (row.method === "pin") {
        if (row.pinLockedUntil && row.pinLockedUntil.getTime() > Date.now()) return "locked" as const;
        const matches = row.pinHash ? await bcrypt.compare(code, row.pinHash) : false;
        if (!matches) {
          const attempts = row.pinFailedAttempts + 1;
          await db.update(userMfa).set({
            pinFailedAttempts: attempts >= 5 ? 0 : attempts,
            pinLockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
          }).where(eq(userMfa.userId, token.userId));
          return "bad" as const;
        }
        await db.update(userMfa).set({ pinFailedAttempts: 0, pinLockedUntil: null }).where(eq(userMfa.userId, token.userId));
        return "ok" as const;
      }
      if (!row.totpSecretCiphertext) return "bad" as const;
      const secret = decryptString(asBuffer(row.totpSecretCiphertext));
      const totp = new TOTP({ secret: Secret.fromBase32(secret), algorithm: "SHA1", digits: 6, period: 30 });
      if (totp.validate({ token: code, window: 1 }) !== null) return "ok" as const;
      const codes = await db.select().from(mfaRecoveryCodes).where(eq(mfaRecoveryCodes.userId, token.userId));
      const recovery = codes.find((item) => !item.usedAt && item.codeHash === sha256(code));
      if (recovery) {
        await db.update(mfaRecoveryCodes).set({ usedAt: new Date() }).where(eq(mfaRecoveryCodes.id, recovery.id));
        return "ok" as const;
      }
      return "bad" as const;
    });
    if (status === "locked") return { ok: false as const, error: "locked" as const };
    if (status !== "ok") return { ok: false as const, error: "code" as const };
    await markMfaVerified(token);
  } catch (error) {
    if (isRedirect(error)) throw error;
    return { ok: false as const, error: "database" as const };
  }
  redirect("/");
}

export async function pendingFactor(userId: string) {
  return withDatabase(async (db, client) => {
    await assumeUser(client, userId);
    const [row] = await db.select({ method: userMfa.method }).from(userMfa).where(eq(userMfa.userId, userId)).limit(1);
    return row?.method ?? null;
  });
}

export async function takeRecoveryCodes() {
  const jar = await cookies();
  const raw = jar.get("sira_recovery_once")?.value ?? "";
  jar.set("sira_recovery_once", "", { path: "/", maxAge: 0 });
  return raw ? raw.split(",") : [];
}

