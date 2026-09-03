import type { ImportantDate, ImportantDateType } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { decrypt } from "@/lib/security/encryption";
import { upsertEvent, deleteEvent } from "./caldav";

const TYPE_EMOJI: Record<ImportantDateType, string> = {
  BIRTHDAY: "🎂",
  ANNIVERSARY: "💍",
  OTHER: "📌",
};

function uidFor(importantDateId: string): string {
  return `lifeos-important-date-${importantDateId}@lifeos.app`;
}

function icsDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function icsTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function buildVEvent(importantDate: ImportantDate): string {
  const uid = uidFor(importantDate.id);
  const summary = `${TYPE_EMOJI[importantDate.type]} ${importantDate.personName}`;
  const descriptionParts = [importantDate.relationship, importantDate.note].filter(Boolean);
  const now = new Date();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LifeOS//Important Dates//ES",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsTimestamp(now)}`,
    `DTSTART;VALUE=DATE:${icsDate(importantDate.date)}`,
    "RRULE:FREQ=YEARLY",
    `SUMMARY:${escapeIcsText(summary)}`,
  ];

  if (descriptionParts.length > 0) {
    lines.push(`DESCRIPTION:${escapeIcsText(descriptionParts.join(" — "))}`);
  }

  if (importantDate.reminderDaysBefore > 0) {
    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcsText(summary)}`,
      `TRIGGER:-P${importantDate.reminderDaysBefore}D`,
      "END:VALARM"
    );
  }

  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

/** Pushes one Important Date to iCloud if the user has a calendar connected.
 * Best-effort: never throws — a failure is recorded on the connection and
 * surfaced in Settings, but never blocks saving the Important Date itself. */
export async function syncImportantDateToCalendar(userId: string, importantDateId: string): Promise<void> {
  const connection = await prisma.calendarConnection.findUnique({ where: { userId } });
  if (!connection) return;

  const importantDate = await prisma.importantDate.findUnique({
    where: { id: importantDateId },
    include: { calendarSync: true },
  });
  if (!importantDate || !importantDate.isActive) {
    if (importantDate) await removeImportantDateFromCalendar(userId, importantDateId);
    return;
  }

  try {
    const appSpecificPassword = decrypt({ ciphertext: connection.credentialCiphertext, iv: connection.credentialIv });
    const uid = uidFor(importantDate.id);
    const existingEventUrl = importantDate.calendarSync
      ? new URL(`${uid}.ics`, connection.lifeosCalendarUrl).href
      : null;

    const result = await upsertEvent({
      email: connection.appleIdEmail,
      appSpecificPassword,
      calendarUrl: connection.lifeosCalendarUrl,
      existingEventUrl,
      existingEtag: importantDate.calendarSync?.externalEtag,
      uid,
      iCalString: buildVEvent(importantDate),
    });

    await prisma.calendarSyncItem.upsert({
      where: { importantDateId: importantDate.id },
      create: { importantDateId: importantDate.id, externalUid: uid, externalEtag: result.etag },
      update: { externalEtag: result.etag },
    });
    await prisma.calendarConnection.update({
      where: { userId },
      data: { lastSyncedAt: new Date(), lastSyncError: null },
    });
  } catch (error) {
    await prisma.calendarConnection.update({
      where: { userId },
      data: { lastSyncError: error instanceof Error ? error.message : "Error desconocido al sincronizar." },
    });
  }
}

export async function removeImportantDateFromCalendar(userId: string, importantDateId: string): Promise<void> {
  const connection = await prisma.calendarConnection.findUnique({ where: { userId } });
  if (!connection) return;

  const syncItem = await prisma.calendarSyncItem.findUnique({ where: { importantDateId } });
  if (!syncItem) return;

  try {
    const appSpecificPassword = decrypt({ ciphertext: connection.credentialCiphertext, iv: connection.credentialIv });
    const eventUrl = new URL(`${syncItem.externalUid}.ics`, connection.lifeosCalendarUrl).href;
    await deleteEvent({ email: connection.appleIdEmail, appSpecificPassword, eventUrl, etag: syncItem.externalEtag });
    await prisma.calendarSyncItem.delete({ where: { importantDateId } });
  } catch (error) {
    await prisma.calendarConnection.update({
      where: { userId },
      data: { lastSyncError: error instanceof Error ? error.message : "Error desconocido al borrar el evento." },
    });
  }
}

/** Pushes every active Important Date for a user — used on first connect and
 * by the daily reconciliation cron. */
export async function syncAllImportantDates(userId: string): Promise<void> {
  const dates = await prisma.importantDate.findMany({ where: { userId, isActive: true }, select: { id: true } });
  for (const d of dates) {
    await syncImportantDateToCalendar(userId, d.id);
  }
}
