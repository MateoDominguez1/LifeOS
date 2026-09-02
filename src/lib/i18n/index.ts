import { getLocale } from "./get-locale";
import { getDictionary } from "./get-dictionary";

export { getLocale } from "./get-locale";
export { getDictionary } from "./get-dictionary";
export { locales, defaultLocale, LOCALE_COOKIE, LOCALE_LABELS, INTL_LOCALES, type Locale } from "./config";
export type { Dictionary } from "./dictionaries/es";

/** Convenience for Server Components: locale + its dictionary in one call. */
export async function getT() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);
  return { locale, t: dictionary };
}
