import { es, enUS, it } from "date-fns/locale";
import type { Locale } from "./config";

export const dateFnsLocales: Record<Locale, typeof es> = { es, en: enUS, it };
