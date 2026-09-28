import { cache } from "react";
import { withDatabase } from "@/lib/db/client";
import { uiStrings } from "@/lib/db/schema";
import { copy, isLocale, type Copy } from "@/lib/i18n";
import { eq } from "drizzle-orm";

// Una lectura por petición. Si la base no está, se usan los textos del código.
export const appCopy = cache(async (locale: string): Promise<Copy> => {
  const base = { ...copy(locale) };
  if (!process.env.DATABASE_URL) {
    return base;
  }
  const code = isLocale(locale) ? locale : "es";
  try {
    const rows = await withDatabase(async (db) => {
      return db.select().from(uiStrings).where(eq(uiStrings.locale, code));
    });
    const merged: Record<string, string> = base;
    for (const row of rows) {
      if (row.stringKey in merged) {
        merged[row.stringKey] = row.value;
      }
    }
    return base;
  } catch {
    return base;
  }
});
