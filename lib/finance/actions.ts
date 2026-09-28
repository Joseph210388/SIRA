"use server";

import { getSession } from "@/lib/auth/session";
import { asBuffer, decryptString, encryptString, randomId, sha256 } from "@/lib/crypto";
import { assumeUser, withDatabase } from "@/lib/db/client";
import {
  accountShares,
  accounts,
  budgets,
  categories,
  movements,
  reminderSettings,
  savingsGoals,
  spaceInvites,
  spaceMembers,
  spaces,
  users,
} from "@/lib/db/schema";
import { timezones } from "@/lib/countries";
import { parseAmountToMinor } from "@/lib/money";
import { isTheme, themeCookie } from "@/lib/theme";
import { and, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const vague = new Set(["otros", "otro", "other", "altro", "autre", "sonstiges"]);

function fail(path: string, code: string): never {
  redirect(`${path}?error=${code}`);
}

function isRedirect(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT");
}

async function requireUser() {
  const session = await getSession();
  if (!session?.mfa) redirect("/login");
  return session;
}

function zonedToUtc(localValue: string, timeZone: string) {
  const asUtc = new Date(`${localValue}:00Z`);
  if (Number.isNaN(asUtc.getTime())) return null;
  const utcTime = new Date(asUtc.toLocaleString("en-US", { timeZone: "UTC" })).getTime();
  const zoneTime = new Date(asUtc.toLocaleString("en-US", { timeZone })).getTime();
  return new Date(asUtc.getTime() - (zoneTime - utcTime));
}

export async function createAccountAction(formData: FormData) {
  const session = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");
  const minor = parseAmountToMinor(String(formData.get("amount") ?? ""));
  const cashOrigin = String(formData.get("cashOrigin") ?? "already");
  const sourceId = String(formData.get("sourceId") ?? "");
  if (name.length < 1 || minor === null || !["current", "savings", "cash"].includes(kind)) fail("/accounts", "generic");
  if (kind === "cash" && cashOrigin === "withdrawal" && minor <= 0) fail("/accounts", "balance");
  try {
    await withDatabase(async (db, client) => {
      await assumeUser(client, session.userId);
      const accountId = randomId();
      await db.insert(accounts).values({
        id: accountId,
        ownerUserId: session.userId,
        kind: kind as "current" | "savings" | "cash",
        nameCiphertext: encryptString(name),
        currencyCode: "EUR",
      });
      if (kind === "cash" && cashOrigin === "withdrawal") {
        const sourceMoves = await db.select().from(movements).where(eq(movements.accountId, sourceId));
        const balance = sourceMoves.reduce((sum, item) => {
          const amount = Number(decryptString(asBuffer(item.amountCiphertext)));
          return sum + (item.direction === "in" ? amount : -amount);
        }, 0);
        if (balance < minor) fail("/accounts", "balance");
        const groupId = randomId();
        const concept = encryptString("withdrawal");
        const amount = encryptString(String(minor));
        const amountOut = encryptString(String(minor));
        await db.insert(movements).values([
          {
            accountId: sourceId,
            actorUserId: session.userId,
            kind: "transfer",
            direction: "out",
            origin: "withdrawal",
            groupId,
            counterpartyAccountId: accountId,
            conceptCiphertext: concept,
            amountCiphertext: amountOut,
            occurredAt: new Date(),
          },
          {
            accountId,
            actorUserId: session.userId,
            kind: "transfer",
            direction: "in",
            origin: "withdrawal",
            groupId,
            counterpartyAccountId: sourceId,
            conceptCiphertext: encryptString("withdrawal"),
            amountCiphertext: amount,
            occurredAt: new Date(),
          },
        ]);
        return;
      }
      if (kind === "cash" && cashOrigin === "gift") {
        const [gift] = await db.select().from(categories).where(and(eq(categories.kind, "income"), eq(categories.key, "gift"))).limit(1);
        if (!gift) fail("/accounts", "database");
        await db.insert(movements).values({
          accountId,
          actorUserId: session.userId,
          kind: "income",
          direction: "in",
          origin: "gift",
          categoryId: gift.id,
          conceptCiphertext: encryptString("gift"),
          amountCiphertext: encryptString(String(minor)),
          occurredAt: new Date(),
        });
        return;
      }
      if (minor > 0) {
        await db.insert(movements).values({
          accountId,
          actorUserId: session.userId,
          kind: "opening",
          direction: "in",
          origin: "opening",
          conceptCiphertext: encryptString("initial"),
          amountCiphertext: encryptString(String(minor)),
          occurredAt: new Date(),
        });
      }
    });
  } catch (error) {
    if (isRedirect(error)) throw error;
    fail("/accounts", "database");
  }
  redirect("/accounts");
}

export async function createMovementAction(formData: FormData) {
  const session = await requireUser();
  const kind = String(formData.get("kind") ?? "");
  const accountId = String(formData.get("accountId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const concept = String(formData.get("concept") ?? "").trim();
  const minor = parseAmountToMinor(String(formData.get("amount") ?? ""));
  const when = zonedToUtc(String(formData.get("when") ?? ""), session.timezone);
  if ((kind !== "expense" && kind !== "income") || !when || minor === null || minor <= 0 || concept.length < 2) {
    fail("/movements", "concept");
  }
  try {
    await withDatabase(async (db, client) => {
      await assumeUser(client, session.userId);
      const [category] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
      if (!category || category.kind !== kind) fail("/movements", "generic");
      if (category.requiresSpecificConcept && (concept.length < 3 || vague.has(concept.toLowerCase()))) {
        fail("/movements", "concept");
      }
      if (kind === "expense") {
        const rows = await db.select().from(movements).where(eq(movements.accountId, accountId));
        const balance = rows.reduce((sum, item) => sum + (item.direction === "in" ? 1 : -1) * Number(decryptString(asBuffer(item.amountCiphertext))), 0);
        if (balance < minor) fail("/movements", "balance");
      }
      await db.insert(movements).values({
        accountId,
        actorUserId: session.userId,
        kind,
        direction: kind === "expense" ? "out" : "in",
        origin: "external",
        categoryId,
        conceptCiphertext: encryptString(concept),
        amountCiphertext: encryptString(String(minor)),
        occurredAt: when,
      });
    });
  } catch (error) {
    if (isRedirect(error)) throw error;
    fail("/movements", "database");
  }
  redirect("/movements");
}

export async function saveBudgetAction(formData: FormData) {
  const session = await requireUser();
  const categoryId = String(formData.get("categoryId") ?? "");
  const minor = parseAmountToMinor(String(formData.get("amount") ?? ""));
  if (minor === null) fail("/budgets", "generic");
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: session.timezone, year: "numeric", month: "2-digit" }).format(new Date()).split("-");
  try {
    await withDatabase(async (db, client) => {
      await assumeUser(client, session.userId);
      const [category] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
      if (!category || category.kind !== "expense") fail("/budgets", "generic");
      await db
        .insert(budgets)
        .values({
          userId: session.userId,
          categoryId,
          year: Number(parts[0]),
          month: Number(parts[1]),
          amountCiphertext: encryptString(String(minor)),
        })
        .onConflictDoUpdate({
          target: [budgets.userId, budgets.categoryId, budgets.year, budgets.month],
          set: { amountCiphertext: encryptString(String(minor)) },
        });
    });
  } catch (error) {
    if (isRedirect(error)) throw error;
    fail("/budgets", "database");
  }
  redirect("/budgets");
}

export async function saveGoalAction(formData: FormData) {
  const session = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const accountId = String(formData.get("accountId") ?? "");
  const minor = parseAmountToMinor(String(formData.get("amount") ?? ""));
  const targetDate = String(formData.get("targetDate") ?? "");
  if (name.length < 2 || minor === null || minor <= 0) fail("/goals", "generic");
  try {
    await withDatabase(async (db, client) => {
      await assumeUser(client, session.userId);
      const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
      if (!account || account.kind !== "savings") fail("/goals", "generic");
      await db.insert(savingsGoals).values({
        userId: session.userId,
        accountId,
        nameCiphertext: encryptString(name),
        targetCiphertext: encryptString(String(minor)),
        targetDate: targetDate || null,
      });
    });
  } catch (error) {
    if (isRedirect(error)) throw error;
    fail("/goals", "database");
  }
  redirect("/goals");
}

export async function createInviteAction() {
  const session = await requireUser();
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const code = Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  try {
    await withDatabase(async (db, client) => {
      await assumeUser(client, session.userId);
      const existing = await db.select().from(spaceMembers).where(and(eq(spaceMembers.userId, session.userId), isNull(spaceMembers.leftAt)));
      if (existing.length > 0) fail("/duo", "generic");
      const spaceId = randomId();
      await db.insert(spaces).values({ id: spaceId, createdBy: session.userId, status: "pending" });
      await db.insert(spaceMembers).values({ spaceId, userId: session.userId });
      await db.insert(spaceInvites).values({
        spaceId,
        createdBy: session.userId,
        codeHash: sha256(code),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      });
    });
  } catch (error) {
    if (isRedirect(error)) throw error;
    return { error: "database" as const, code: null };
  }
  return { error: null, code };
}

export async function acceptInviteAction(formData: FormData) {
  const session = await requireUser();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (code.length < 6) fail("/duo", "code");
  try {
    await withDatabase(async (_db, client) => {
      await assumeUser(client, session.userId);
      await client.query("select sira_private.accept_space_invite($1)", [sha256(code)]);
    });
  } catch (error) {
    if (isRedirect(error)) throw error;
    fail("/duo", "code");
  }
  redirect("/duo");
}

export async function toggleShareAction(formData: FormData) {
  const session = await requireUser();
  const accountId = String(formData.get("accountId") ?? "");
  const shared = String(formData.get("shared") ?? "") === "yes";
  try {
    await withDatabase(async (db, client) => {
      await assumeUser(client, session.userId);
      const [member] = await db
        .select({ spaceId: spaceMembers.spaceId })
        .from(spaceMembers)
        .innerJoin(spaces, eq(spaces.id, spaceMembers.spaceId))
        .where(and(eq(spaceMembers.userId, session.userId), isNull(spaceMembers.leftAt), eq(spaces.status, "active")))
        .limit(1);
      if (!member) fail("/duo", "generic");
      if (shared) {
        await db.update(accountShares).set({ revokedAt: new Date() }).where(and(eq(accountShares.accountId, accountId), isNull(accountShares.revokedAt)));
        return;
      }
      await db.insert(accountShares).values({
        accountId,
        spaceId: member.spaceId,
        sharedBy: session.userId,
        canWrite: false,
      });
    });
  } catch (error) {
    if (isRedirect(error)) throw error;
    fail("/duo", "database");
  }
  redirect("/duo");
}

export async function saveSettingsAction(formData: FormData) {
  const session = await requireUser();
  const timezone = String(formData.get("timezone") ?? "Europe/Madrid");
  const enabled = formData.get("reminder") === "on";
  const localTime = String(formData.get("localTime") ?? "19:30");
  if (!timezones.includes(timezone as (typeof timezones)[number]) || !/^\d{2}:\d{2}$/.test(localTime)) {
    fail("/settings", "generic");
  }
  try {
    await withDatabase(async (db, client) => {
      await assumeUser(client, session.userId);
      await db.update(users).set({ timezone }).where(eq(users.id, session.userId));
      await db.update(reminderSettings).set({ enabled, localTime: `${localTime}:00` }).where(eq(reminderSettings.userId, session.userId));
    });
  } catch (error) {
    if (isRedirect(error)) throw error;
    fail("/settings", "database");
  }
  redirect("/settings");
}

export async function setThemeAction(formData: FormData) {
  const session = await requireUser();
  const theme = String(formData.get("theme") ?? "");
  if (!isTheme(theme)) fail("/settings", "generic");
  try {
    await withDatabase(async (db, client) => {
      await assumeUser(client, session.userId);
      await db.update(users).set({ theme }).where(eq(users.id, session.userId));
    });
  } catch (error) {
    if (isRedirect(error)) throw error;
    fail("/settings", "database");
  }
  const jar = await cookies();
  const cookie = themeCookie(theme);
  jar.set(cookie.name, cookie.value, cookie.options);
  redirect("/settings");
}
