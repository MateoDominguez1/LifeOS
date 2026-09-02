export const locales = ["es", "en", "it"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";
export const LOCALE_COOKIE = "lifeos-locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  es: "Español",
  en: "English",
  it: "Italiano",
};

/** BCP-47 tags for `Intl`/`toLocaleDateString` calls. */
export const INTL_LOCALES: Record<Locale, string> = {
  es: "es-AR",
  en: "en-US",
  it: "it-IT",
};
