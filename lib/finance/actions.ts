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
  userCategoryPicks,
  users,
} from "@/lib/db/schema";
import { timezones } from "@/lib/countries";
import { zonedToUtc } from "@/lib/period";
import { parseAmountToMinor } from "@/lib/money";
import { isTheme, themeCookie } from "@/lib/theme";
import { redirectWithError } from "@/lib/redirect";
import { allowedNext, cleanConcept, cleanLabel } from "@/lib/validation";
import { and, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const vague = new Set(["otros", "otro", "other", "altro", "autre", "sonstiges"]);

function fail(path: string, code: string): never {
  redirectWithError(path, code);
}

function isRedirect(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT");
}

async function requireUser() {
  const session = await getSession();
  if (!session?.mfa) redirect("/login");
  return session;
}

function minorBalance(rows: { direction: string; amountCiphertext: Buffer }[]) {
  return rows.reduce((sum, item) => {
    const amount = Number(decryptString(asBuffer(item.amountCiphertext)));
    return sum + (item.direction === "in" ? amount : -amount);
  }, 0);
}

export async function createAccountAction(formData: FormData) {
  const session = await requireUser();
  const done = allowedNext(String(formData.get("next") ?? ""), "/accounts");
  const back = done === "/" ? "/" : "/accounts";
  const name = cleanLabel(String(formData.get("name") ?? ""), 40);
  const family = String(formData.get("family") ?? "");
  const bankKind = String(formData.get("bankKind") ?? "current");
  const origin = String(formData.get("origin") ?? "already");
  const minor = parseAmountToMinor(String(formData.get("amount") ?? ""));
  const sourceId = String(formData.get("sourceId") ?? "");
  const incomeKey = String(formData.get("incomeKey") ?? "");
  const kind = family === "cash" ? "cash" : bankKind;
  if (!name || minor === null || (kind !== "current" && kind !== "savings" && kind !== "cash")) fail(back, "generic");
  const needsSource = (kind === "cash" && origin === "withdrawal") || (kind !== "cash" && origin === "transfer");
  if (needsSource && minor <= 0) fail(back, "balance");
  try {
    await withDatabase(async (db, client) => {
      await assumeUser(client, session.userId);
      const [person] = await db.select({ currencyCode: users.currencyCode }).from(users).where(eq(users.id, session.userId)).limit(1);
      const accountId = randomId();
      await db.insert(accounts).values({
        id: accountId,
        ownerUserId: session.userId,
        kind,
        nameCiphertext: encryptString(name),
        currencyCode: person?.currencyCode ?? "EUR",
      });
      if (needsSource) {
        const sourceMoves = await db.select().from(movements).where(eq(movements.accountId, sourceId));
        if (minorBalance(sourceMoves) < minor) fail(back, "balance");
        const groupId = randomId();
        const moveOrigin = kind === "cash" ? "withdrawal" : "between_accounts";
        const amount = encryptString(String(minor));
        await db.insert(movements).values([
          {
            accountId: sourceId,
            actorUserId: session.userId,
            kind: "transfer",
            direction: "out",
            origin: moveOrigin,
            groupId,
            counterpartyAccountId: accountId,
            conceptCiphertext: encryptString(moveOrigin),
            amountCiphertext: amount,
            occurredAt: new Date(),
          },
          {
            accountId,
            actorUserId: session.userId,
            kind: "transfer",
            direction: "in",
            origin: moveOrigin,
            groupId,
            counterpartyAccountId: sourceId,
            conceptCiphertext: encryptString(moveOrigin),
            amountCiphertext: amount,
            occurredAt: new Date(),
          },
        ]);
        return;
      }
      if ((kind === "cash" && origin === "gift") || (kind !== "cash" && origin === "income")) {
        const key = kind === "cash" ? "gift" : incomeKey;
        const [category] = await db.select().from(categories).where(and(eq(categories.kind, "income"), eq(categories.key, key))).limit(1);
        if (!category) fail(back, "database");
        await db.insert(movements).values({
          accountId,
          actorUserId: session.userId,
          kind: "income",
          direction: "in",
          origin: key === "gift" ? "gift" : "external",
          categoryId: category.id,
          conceptCiphertext: encryptString(key),
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
    const cause = error instanceof Error && "cause" in error && error.cause instanceof Error ? error.cause.message : "";
    console.error("createAccountAction", cause.split("\n")[0] || (error instanceof Error ? error.message : "database"));
    fail(back, "database");
  }
  redirect(done);
}

export async function createMovementAction(formData: FormData) {
  const session = await requireUser();
  const kind = String(formData.get("kind") ?? "");
  const accountId = String(formData.get("accountId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const concept = cleanConcept(String(formData.get("concept") ?? ""));
  const minor = parseAmountToMinor(String(formData.get("amount") ?? ""));
  const when = zonedToUtc(String(formData.get("when") ?? ""), session.timezone);
  if ((kind !== "expense" && kind !== "income") || !when || minor === null || minor <= 0 || !concept) {
    fail("/accounts?form=movement", "concept");
  }
  try {
    await withDatabase(async (db, client) => {
      await assumeUser(client, session.userId);
      const [category] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
      if (!category || category.kind !== kind) fail("/accounts?form=movement", "generic");
      if (category.requiresSpecificConcept && (concept.length < 3 || vague.has(concept.toLowerCase()))) {
        fail("/accounts?form=movement", "concept");
      }
      if (kind === "expense") {
        const rows = await db.select().from(movements).where(eq(movements.accountId, accountId));
        const balance = rows.reduce((sum, item) => sum + (item.direction === "in" ? 1 : -1) * Number(decryptString(asBuffer(item.amountCiphertext))), 0);
        if (balance < minor) fail("/accounts?form=movement", "balance");
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
    fail("/accounts?form=movement", "database");
  }
  redirect("/accounts");
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
  const back = String(formData.get("next") ?? "") === "/" ? "/?form=goal" : "/goals?form=goal";
  const done = back.startsWith("/?") ? "/" : "/goals";
  const name = cleanLabel(String(formData.get("name") ?? ""), 40);
  const minor = parseAmountToMinor(String(formData.get("amount") ?? ""));
  const startedRaw = String(formData.get("saved") ?? "").trim();
  const started = startedRaw === "" ? 0 : parseAmountToMinor(startedRaw);
  const targetDate = String(formData.get("targetDate") ?? "");
  if (!name || minor === null || minor <= 0 || started === null || started < 0) fail(back, "generic");
  try {
    await withDatabase(async (db, client) => {
      await assumeUser(client, session.userId);
      await db.insert(savingsGoals).values({
        userId: session.userId,
        nameCiphertext: encryptString(name),
        targetCiphertext: encryptString(String(minor)),
        savedCiphertext: encryptString(String(started)),
        targetDate: targetDate || null,
      });
    });
  } catch (error) {
    if (isRedirect(error)) throw error;
    const cause = error instanceof Error && "cause" in error && error.cause instanceof Error ? error.cause.message : "";
    console.error("saveGoalAction", cause.split("\n")[0] || (error instanceof Error ? error.message : "database"));
    fail(back, "database");
  }
  redirect(done);
}

const goalIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function addToGoalAction(formData: FormData) {
  const session = await requireUser();
  const goalId = String(formData.get("goalId") ?? "");
  const extra = parseAmountToMinor(String(formData.get("amount") ?? ""));
  if (!goalIdPattern.test(goalId) || extra === null || extra <= 0) fail("/?form=add", "generic");
  try {
    await withDatabase(async (db, client) => {
      await assumeUser(client, session.userId);
      const [goal] = await db.select().from(savingsGoals).where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.userId, session.userId), isNull(savingsGoals.archivedAt))).limit(1);
      if (!goal) fail("/?form=add", "generic");
      const current = goal.savedCiphertext ? Number(decryptString(asBuffer(goal.savedCiphertext))) : 0;
      const next = (Number.isFinite(current) ? current : 0) + extra;
      await db.update(savingsGoals).set({ savedCiphertext: encryptString(String(next)) }).where(eq(savingsGoals.id, goalId));
    });
  } catch (error) {
    if (isRedirect(error)) throw error;
    const cause = error instanceof Error && "cause" in error && error.cause instanceof Error ? error.cause.message : "";
    console.error("addToGoalAction", cause.split("\n")[0] || (error instanceof Error ? error.message : "database"));
    fail("/?form=add", "database");
  }
  redirect(`/?goal=${goalId}`);
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
  const next = allowedNext(String(formData.get("next") ?? ""), "/settings");
  const back = next === "/" ? "/" : "/settings";
  const theme = String(formData.get("theme") ?? "");
  if (!isTheme(theme)) fail(back, "generic");
  try {
    await withDatabase(async (db, client) => {
      await assumeUser(client, session.userId);
      await db.update(users).set({ theme, themeChosenAt: new Date() }).where(eq(users.id, session.userId));
    });
  } catch (error) {
    if (isRedirect(error)) throw error;
    fail(back, "database");
  }
  const jar = await cookies();
  const cookie = themeCookie(theme);
  jar.set(cookie.name, cookie.value, cookie.options);
  redirect(next);
}

const currencyCodes = ["PEN", "USD", "EUR", "GBP"];

export async function setCurrencyAction(formData: FormData) {
  const session = await requireUser();
  const currency = String(formData.get("currency") ?? "");
  if (!currencyCodes.includes(currency)) fail("/settings", "generic");
  try {
    await withDatabase(async (db, client) => {
      await assumeUser(client, session.userId);
      await db.update(users).set({ currencyCode: currency }).where(eq(users.id, session.userId));
    });
  } catch (error) {
    if (isRedirect(error)) throw error;
    fail("/settings", "database");
  }
  redirect("/settings");
}

export async function saveCategoriesAction(formData: FormData) {
  const session = await requireUser();
  const picked = formData.getAll("category").map(String).filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (picked.length < 1) fail("/", "generic");
  try {
    await withDatabase(async (db, client) => {
      await assumeUser(client, session.userId);
      await db.delete(userCategoryPicks).where(eq(userCategoryPicks.userId, session.userId));
      await db.insert(userCategoryPicks).values(picked.map((categoryId) => ({ userId: session.userId, categoryId })));
      await db.update(users).set({ categoriesChosenAt: new Date() }).where(eq(users.id, session.userId));
    });
  } catch (error) {
    if (isRedirect(error)) throw error;
    fail("/", "database");
  }
  redirect("/");
}
