import { asBuffer, decryptString } from "@/lib/crypto";
import { assumeUser, withDatabase } from "@/lib/db/client";
import {
  accountShares,
  accounts,
  budgets,
  categories,
  userCategoryPicks,
  movements,
  profiles,
  reminderDispatches,
  reminderSettings,
  savingsGoals,
  spaceMembers,
  spaces,
} from "@/lib/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";

export type AccountRow = {
  id: string;
  name: string;
  kind: "current" | "savings" | "cash";
  balance: number;
  shared: boolean;
};

export type MovementRow = {
  id: string;
  accountId: string;
  accountName: string;
  kind: string;
  concept: string;
  amount: number;
  direction: "in" | "out";
  occurredAt: Date;
  categoryKey: string | null;
  categoryName: string | null;
};

export type CategoryRow = {
  id: string;
  kind: string;
  key: string | null;
  name: string | null;
  requiresSpecificConcept: boolean;
};

function minor(value: unknown) {
  const parsed = Number(decryptString(asBuffer(value)));
  return Number.isFinite(parsed) ? parsed : 0;
}

function monthOf(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit" }).format(date);
}

function dayOf(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function hourOf(date: Date, timeZone: string) {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(date));
}

export async function loadFinance(userId: string, timeZone: string) {
  return withDatabase(async (db, client) => {
    await assumeUser(client, userId);
    const accountList = await db.select().from(accounts).where(and(eq(accounts.ownerUserId, userId), isNull(accounts.archivedAt)));
    const movementList = await db.select().from(movements).where(eq(movements.actorUserId, userId)).orderBy(desc(movements.occurredAt));
    const everyCategory = await db.select().from(categories);
    const picks = await db.select().from(userCategoryPicks).where(eq(userCategoryPicks.userId, userId));
    const pickedIds = new Set(picks.map((item) => item.categoryId));
    const categoryList = pickedIds.size > 0
      ? everyCategory.filter((item) => pickedIds.has(item.id) || item.ownerUserId === userId)
      : everyCategory;
    const shareList = await db.select().from(accountShares).where(and(eq(accountShares.sharedBy, userId), isNull(accountShares.revokedAt)));
    const sharedIds = new Set(shareList.map((item) => item.accountId));
    const names = new Map(accountList.map((item) => [item.id, decryptString(asBuffer(item.nameCiphertext))]));
    const balances = new Map<string, number>();
    for (const item of movementList) {
      const amount = minor(item.amountCiphertext);
      const current = balances.get(item.accountId) ?? 0;
      balances.set(item.accountId, current + (item.direction === "in" ? amount : -amount));
    }
    const accountViews: AccountRow[] = accountList.map((item) => ({
      id: item.id,
      name: names.get(item.id) ?? "",
      kind: item.kind,
      balance: balances.get(item.id) ?? 0,
      shared: sharedIds.has(item.id),
    }));
    const categoryById = new Map(categoryList.map((item) => [item.id, item]));
    const movementViews: MovementRow[] = movementList.slice(0, 40).map((item) => {
      const category = item.categoryId ? categoryById.get(item.categoryId) : undefined;
      return {
        id: item.id,
        accountId: item.accountId,
        accountName: names.get(item.accountId) ?? "",
        kind: item.kind,
        concept: decryptString(asBuffer(item.conceptCiphertext)),
        amount: minor(item.amountCiphertext),
        direction: item.direction,
        occurredAt: item.occurredAt,
        categoryKey: category?.key ?? null,
        categoryName: category?.nameCiphertext ? decryptString(asBuffer(category.nameCiphertext)) : null,
      };
    });
    const currentMonth = monthOf(new Date(), timeZone);
    const byCategory = new Map<string, number>();
    const spentByCategory = new Map<string, number>();
    const byHour = Array.from({ length: 24 }, () => 0);
    let monthIncome = 0;
    let monthExpense = 0;
    for (const item of movementList) {
      if (monthOf(item.occurredAt, timeZone) !== currentMonth) continue;
      const amount = minor(item.amountCiphertext);
      if (item.kind === "income" && item.direction === "in") monthIncome += amount;
      if (item.kind !== "expense" || item.direction !== "out") continue;
      monthExpense += amount;
      const category = item.categoryId ? categoryById.get(item.categoryId) : undefined;
      const label = category?.key ?? "other";
      byCategory.set(label, (byCategory.get(label) ?? 0) + amount);
      if (item.categoryId) spentByCategory.set(item.categoryId, (spentByCategory.get(item.categoryId) ?? 0) + amount);
      const hour = hourOf(item.occurredAt, timeZone);
      if (hour >= 0 && hour <= 23) byHour[hour] += amount;
    }
    const categoryViews: CategoryRow[] = categoryList
      .filter((item) => item.ownerUserId === null || item.ownerUserId === userId)
      .map((item) => ({
        id: item.id,
        kind: item.kind,
        key: item.key,
        name: item.nameCiphertext ? decryptString(asBuffer(item.nameCiphertext)) : null,
        requiresSpecificConcept: item.requiresSpecificConcept,
      }));
    const budgetList = await db.select().from(budgets).where(eq(budgets.userId, userId));
    const [yearText, monthText] = currentMonth.split("-");
    const year = Number(yearText);
    const month = Number(monthText);
    const budgetViews = budgetList
      .filter((item) => item.year === year && item.month === month)
      .map((item) => ({
        categoryId: item.categoryId,
        limit: minor(item.amountCiphertext),
      }));
    const goalList = await db.select().from(savingsGoals).where(and(eq(savingsGoals.userId, userId), isNull(savingsGoals.archivedAt)));
    const goalViews = goalList.map((item) => ({
      id: item.id,
      accountId: item.accountId,
      name: decryptString(asBuffer(item.nameCiphertext)),
      target: minor(item.targetCiphertext),
      targetDate: item.targetDate,
      balance: balances.get(item.accountId) ?? 0,
    }));
    const membership = await db
      .select({ spaceId: spaceMembers.spaceId, status: spaces.status })
      .from(spaceMembers)
      .innerJoin(spaces, eq(spaces.id, spaceMembers.spaceId))
      .where(and(eq(spaceMembers.userId, userId), isNull(spaceMembers.leftAt)));
    const active = membership.find((item) => item.status === "active");
    let partnerName: string | null = null;
    if (active) {
      const people = await db.select().from(spaceMembers).where(and(eq(spaceMembers.spaceId, active.spaceId), isNull(spaceMembers.leftAt)));
      const other = people.find((item) => item.userId !== userId);
      if (other) {
        const [profile] = await db.select().from(profiles).where(eq(profiles.userId, other.userId)).limit(1);
        partnerName = profile?.displayName ?? null;
      }
    }
    const [reminder] = await db.select().from(reminderSettings).where(eq(reminderSettings.userId, userId)).limit(1);
    const today = dayOf(new Date(), timeZone);
    let showReminder = false;
    if (reminder?.enabled) {
      const nowTime = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
      const target = String(reminder.localTime).slice(0, 5);
      if (nowTime >= target) {
        const sent = await db.select().from(reminderDispatches).where(and(eq(reminderDispatches.userId, userId), eq(reminderDispatches.sentOn, today))).limit(1);
        if (sent.length === 0) {
          await db.insert(reminderDispatches).values({ userId, sentOn: today });
          showReminder = true;
        }
      }
    }
    return {
      accounts: accountViews,
      movements: movementViews,
      categories: categoryViews,
      byCategory: [...byCategory.entries()].map(([key, total]) => ({ key, total })),
      spentByCategory: [...spentByCategory.entries()].map(([categoryId, total]) => ({ categoryId, total })),
      byHour: byHour.map((total, hour) => ({ hour: String(hour).padStart(2, "0"), total })),
      budgets: budgetViews,
      goals: goalViews,
      partnerName,
      hasSpace: Boolean(active),
      reminder: {
        enabled: reminder?.enabled ?? false,
        localTime: String(reminder?.localTime ?? "19:30").slice(0, 5),
      },
      showReminder,
      total: accountViews.reduce((sum, item) => sum + item.balance, 0),
      monthIncome,
      monthExpense,
      savingsTotal: accountViews.filter((item) => item.kind === "savings").reduce((sum, item) => sum + item.balance, 0),
    };
  });
}
