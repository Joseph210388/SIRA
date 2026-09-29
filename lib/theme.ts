import { withDatabase } from "@/lib/db/client";
import { themes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { CSSProperties } from "react";

export const themeIds = ["emerald", "crimson", "purple", "ocean", "rose"] as const;

export type ThemeId = (typeof themeIds)[number];

export const themeCookieName = "sira_theme";

// Muestras de la paleta, solo para el selector. El panel usa las variables de globals.css.
export const themeSwatches: Record<ThemeId, [string, string, string, string, string]> = {
  emerald: ["#081C15", "#1B4332", "#036666", "#FBB02D", "#EBF2FA"],
  crimson: ["#540D0E", "#9E2A2B", "#E08F3E", "#B1A7A6", "#FFFBF0"],
  purple: ["#240046", "#E0AAFF", "#FBB02D", "#ECCAFF", "#03071E"],
  ocean: ["#03045E", "#023E8A", "#00B4D8", "#CAF0F8", "#FBB02D"],
  rose: ["#820437", "#8A2846", "#99375E", "#FCCAD4", "#E05780"],
};

export function isTheme(value: string | undefined | null): value is ThemeId {
  return themeIds.includes(value as ThemeId);
}

const themeCache = new Map<string, { at: number; value: CSSProperties | null }>();

// Los colores salen de la tabla themes. En local se recuerdan un momento para no abrir la base en cada clic.
export async function themeVarsFor(code: string): Promise<CSSProperties | null> {
  const cached = themeCache.get(code);
  if (cached && Date.now() - cached.at < 30_000) return cached.value;
  try {
    const value = await withDatabase(async (db) => {
      const [row] = await db.select().from(themes).where(eq(themes.code, code)).limit(1);
      if (!row) return null;
      return {
        "--page": row.pageRgb,
        "--surface": row.surfaceRgb,
        "--ink": row.inkRgb,
        "--primary": row.primaryRgb,
        "--primary-dark": row.primaryDarkRgb,
        "--soft": row.softRgb,
        "--accent": row.accentRgb,
        "--danger": row.dangerRgb,
        "--income": row.incomeRgb,
        "--expense": row.expenseRgb,
        "--savings": row.savingsRgb,
        "--chart-1": row.chart1Rgb,
        "--chart-2": row.chart2Rgb,
        "--chart-3": row.chart3Rgb,
        "--chart-4": row.chart4Rgb,
      } as CSSProperties;
    });
    themeCache.set(code, { at: Date.now(), value });
    return value;
  } catch {
    return null;
  }
}

export function themeCookie(theme: ThemeId) {
  return {
    name: themeCookieName,
    value: theme,
    options: { path: "/", sameSite: "lax" as const, maxAge: 60 * 60 * 24 * 365 },
  };
}
