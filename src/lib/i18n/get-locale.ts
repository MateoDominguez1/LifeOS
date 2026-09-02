import { cookies } from "next/headers";
import { defaultLocale, locales, LOCALE_COOKIE, type Locale } from "./config";

/** Server-only: reads the active locale from a cookie (set by the language
 * switcher in Settings). No DB round-trip on every page — durable
 * persistence across devices lives in `UserPreference.language`, which is
 * read once to seed the cookie right after login/register (see auth.ts). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return (locales as readonly string[]).includes(value ?? "") ? (value as Locale) : defaultLocale;
}
