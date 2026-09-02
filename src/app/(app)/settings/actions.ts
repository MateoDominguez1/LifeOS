"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { signOut } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { locales, LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function setLocale(locale: Locale) {
  if (!locales.includes(locale)) throw new Error("Invalid locale");

  const userId = await requireUserId();
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, { maxAge: 60 * 60 * 24 * 365, path: "/" });

  await prisma.userPreference.upsert({
    where: { userId },
    create: { userId, language: locale },
    update: { language: locale },
  });

  revalidatePath("/");
}
