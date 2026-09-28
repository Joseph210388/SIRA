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

export function themeCookie(theme: ThemeId) {
  return {
    name: themeCookieName,
    value: theme,
    options: { path: "/", sameSite: "lax" as const, maxAge: 60 * 60 * 24 * 365 },
  };
}
