import { sha256 } from "@/lib/crypto";
import { assumeUser, withDatabase } from "@/lib/db/client";
import { profiles, sessions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { cache } from "react";

const cookieName = "sira_session";
const maxAgeSeconds = 60 * 60 * 24 * 14;

export type SessionContext = {
  userId: string;
  sessionId: string;
  mfa: boolean;
  locale: string;
  timezone: string;
  theme: string;
  currency: string;
  displayName: string;
};

type TokenPayload = {
  userId: string;
  sessionId: string;
  tok: string;
  mfa: boolean;
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET");
  }
  return new TextEncoder().encode(value);
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

async function issueToken(input: TokenPayload) {
  return new SignJWT({ mfa: input.mfa, tok: input.tok })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.userId)
    .setJti(input.sessionId)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(secret());
}

export async function readToken(token: string): Promise<TokenPayload | null> {
  const { payload } = await jwtVerify(token, secret());
  const userId = payload.sub;
  const sessionId = payload.jti;
  const tok = payload.tok;
  if (!userId || !sessionId || typeof tok !== "string") {
    return null;
  }
  return {
    userId,
    sessionId,
    tok,
    mfa: payload.mfa === true,
  };
}

async function writeCookie(token: string) {
  const jar = await cookies();
  jar.set(cookieName, token, cookieOptions());
}

export async function createSession(userId: string, mfa: boolean) {
  const sessionId = randomUUID();
  const tok = randomUUID();
  const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);
  await withDatabase(async (db, client) => {
    await assumeUser(client, userId);
    await db.insert(sessions).values({
      id: sessionId,
      userId,
      tokenHash: sha256(tok),
      expiresAt,
      mfaVerifiedAt: mfa ? new Date() : null,
    });
  });
  await writeCookie(await issueToken({ userId, sessionId, tok, mfa }));
}

export async function markMfaVerified(current: TokenPayload) {
  await withDatabase(async (db, client) => {
    await assumeUser(client, current.userId);
    await db.update(sessions).set({ mfaVerifiedAt: new Date() }).where(eq(sessions.id, current.sessionId));
  });
  await writeCookie(await issueToken({ ...current, mfa: true }));
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token) {
    try {
      const current = await readToken(token);
      if (current) {
        await withDatabase(async (db, client) => {
          await assumeUser(client, current.userId);
          await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, current.sessionId));
        });
      }
    } catch {
      // Si la base no responde, la cookie igual se borra.
    }
  }
  jar.set(cookieName, "", { ...cookieOptions(), maxAge: 0 });
}

// La misma petición (layout y página) comparte una sola lectura.
export const getSession = cache(async (): Promise<SessionContext | null> => {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) {
    return null;
  }
  let current: TokenPayload | null;
  try {
    current = await readToken(token);
  } catch {
    return null;
  }
  if (!current) {
    return null;
  }
  const active = current;
  return withDatabase(async (db, client) => {
    await assumeUser(client, active.userId);
    const [row] = await db
      .select({
        tokenHash: sessions.tokenHash,
        expiresAt: sessions.expiresAt,
        revokedAt: sessions.revokedAt,
        mfaVerifiedAt: sessions.mfaVerifiedAt,
        locale: users.locale,
        timezone: users.timezone,
        theme: users.theme,
        currency: users.currencyCode,
        displayName: profiles.displayName,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .innerJoin(profiles, eq(profiles.userId, sessions.userId))
      .where(eq(sessions.id, active.sessionId))
      .limit(1);
    if (!row || row.revokedAt || row.expiresAt.getTime() < Date.now()) {
      return null;
    }
    if (row.tokenHash !== sha256(active.tok)) {
      return null;
    }
    return {
      userId: active.userId,
      sessionId: active.sessionId,
      mfa: active.mfa && row.mfaVerifiedAt !== null,
      locale: row.locale,
      timezone: row.timezone,
      theme: row.theme,
      currency: row.currency,
      displayName: row.displayName,
    };
  });
});

export async function currentToken() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) {
    return null;
  }
  try {
    return await readToken(token);
  } catch {
    return null;
  }
}
