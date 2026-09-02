import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/es";

const loaders: Record<Locale, () => Promise<{ default: Dictionary }>> = {
  es: () => import("./dictionaries/es"),
  en: () => import("./dictionaries/en"),
  it: () => import("./dictionaries/it"),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const mod = await loaders[locale]();
  return mod.default;
}

export type { Dictionary, Locale };
