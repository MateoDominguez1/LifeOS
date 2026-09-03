"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { signOut } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { locales, LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";
import { encrypt } from "@/lib/security/encryption";
import { connectAndEnsureCalendar } from "@/lib/calendar/caldav";
import { syncAllImportantDates } from "@/lib/calendar/importantDateSync";
import { getT } from "@/lib/i18n";

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

export type CalendarConnectState = { error?: string } | undefined;

export async function connectCalendarAction(
  _prevState: CalendarConnectState,
  formData: FormData
): Promise<CalendarConnectState> {
  const userId = await requireUserId();
  const { t } = await getT();
  const email = String(formData.get("email") ?? "").trim();
  const appSpecificPassword = String(formData.get("appSpecificPassword") ?? "").trim();

  if (!email || !appSpecificPassword) {
    return { error: t.settings.calendarValidationError };
  }

  let result;
  try {
    result = await connectAndEnsureCalendar({ email, appSpecificPassword });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No pudimos conectar con iCloud." };
  }

  const { ciphertext, iv } = encrypt(appSpecificPassword);
  await prisma.calendarConnection.upsert({
    where: { userId },
    create: {
      userId,
      appleIdEmail: email,
      credentialCiphertext: ciphertext,
      credentialIv: iv,
      calendarHomeUrl: result.calendarHomeUrl,
      lifeosCalendarUrl: result.lifeosCalendarUrl,
    },
    update: {
      appleIdEmail: email,
      credentialCiphertext: ciphertext,
      credentialIv: iv,
      calendarHomeUrl: result.calendarHomeUrl,
      lifeosCalendarUrl: result.lifeosCalendarUrl,
      lastSyncError: null,
    },
  });

  await syncAllImportantDates(userId);

  revalidatePath("/settings");
}

export async function disconnectCalendarAction() {
  const userId = await requireUserId();
  await prisma.calendarSyncItem.deleteMany({ where: { importantDate: { userId } } });
  await prisma.calendarConnection.delete({ where: { userId } }).catch(() => {});
  revalidatePath("/settings");
}
