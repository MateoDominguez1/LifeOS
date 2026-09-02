import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import { generateOccurrences } from "./generateOccurrences";

export type ImportantDateKind = "BIRTHDAY" | "ANNIVERSARY" | "OTHER";

export interface ImportantDateLike {
  id: string;
  personName: string;
  relationship: string | null;
  type: ImportantDateKind;
  /** Solo importan el día y el mes: se repite todos los años. */
  date: Date;
  reminderDaysBefore: number;
  isActive: boolean;
}

export interface UpcomingImportantDate {
  id: string;
  personName: string;
  relationship: string | null;
  type: ImportantDateKind;
  occurrence: Date;
  daysUntil: number;
  withinReminderWindow: boolean;
}

/**
 * Próxima ocurrencia de cada fecha importante activa dentro de los próximos
 * `horizonDays`, ordenadas por cercanía. Reutiliza generateOccurrences en
 * modo anual, así que ya maneja años bisiestos (29 de febrero) igual que
 * los gastos fijos anuales.
 */
export function getUpcomingImportantDates(
  dates: ImportantDateLike[],
  today: Date,
  horizonDays: number = 60
): UpcomingImportantDate[] {
  const todayStart = startOfDay(today);
  const horizonEnd = addDays(todayStart, horizonDays);

  const upcoming: UpcomingImportantDate[] = [];

  for (const item of dates) {
    if (!item.isActive) continue;

    const occurrences = generateOccurrences(
      { referenceDay: item.date.getDate(), frequency: "YEARLY", startDate: item.date },
      todayStart,
      horizonEnd
    );
    const next = occurrences[0];
    if (!next) continue;

    const daysUntil = differenceInCalendarDays(next, todayStart);
    upcoming.push({
      id: item.id,
      personName: item.personName,
      relationship: item.relationship,
      type: item.type,
      occurrence: next,
      daysUntil,
      withinReminderWindow: daysUntil <= item.reminderDaysBefore,
    });
  }

  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
}
