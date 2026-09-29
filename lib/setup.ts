import { assumeUser, withDatabase } from "@/lib/db/client";
import { accounts, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cache } from "react";

export type SetupStep = "account" | "categories" | "theme";

// La primera entrada no abre el panel vacío: cuenta, categorías y tema, en ese orden.
export const pendingSetup = cache(async (userId: string): Promise<SetupStep | null> => {
  return withDatabase(async (db, client) => {
    await assumeUser(client, userId);
    const [person] = await db
      .select({
        themeChosenAt: users.themeChosenAt,
        categoriesChosenAt: users.categoriesChosenAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const [account] = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.ownerUserId, userId)).limit(1);
    if (!account) return "account";
    if (!person?.categoriesChosenAt) return "categories";
    if (!person.themeChosenAt) return "theme";
    return null;
  });
});
