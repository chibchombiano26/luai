export type AppLocale = "es" | "en";

export const DEFAULT_LOCALE: AppLocale = "es";

export function normalizeLocale(value: unknown): AppLocale {
  if (value === "en") return "en";
  return "es";
}

