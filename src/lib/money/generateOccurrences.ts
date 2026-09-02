import { addDays, addMonths, addYears, isAfter, isBefore, startOfDay } from "date-fns";

export type RecurrenceFrequency = "WEEKLY" | "MONTHLY" | "YEARLY";

export interface RecurringTemplate {
  /** Día del mes (1-31) para MONTHLY/YEARLY, o día de la semana (0=domingo..6=sábado) para WEEKLY. */
  referenceDay: number;
  frequency: RecurrenceFrequency;
  startDate: Date;
  endDate?: Date | null;
}

function clampDayInMonth(year: number, monthIndex: number, day: number): Date {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(Math.max(day, 1), daysInMonth));
}

function isWithinTemplateBounds(date: Date, template: RecurringTemplate): boolean {
  if (isBefore(date, startOfDay(template.startDate))) return false;
  if (template.endDate && isAfter(date, startOfDay(template.endDate))) return false;
  return true;
}

/**
 * Genera las fechas de ocurrencia de un gasto fijo/ingreso recurrente dentro
 * de [rangeStart, rangeEnd], respetando startDate/endDate de la plantilla.
 */
export function generateOccurrences(
  template: RecurringTemplate,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  const start = startOfDay(rangeStart);
  const end = startOfDay(rangeEnd);
  if (isAfter(start, end)) return [];

  const occurrences: Date[] = [];

  if (template.frequency === "WEEKLY") {
    const targetDay = ((template.referenceDay % 7) + 7) % 7;
    const diffToFirstMatch = (targetDay - start.getDay() + 7) % 7;
    let cursor = addDays(start, diffToFirstMatch);
    let safety = 0;
    while (!isAfter(cursor, end) && safety < 2000) {
      if (isWithinTemplateBounds(cursor, template)) occurrences.push(cursor);
      cursor = addDays(cursor, 7);
      safety += 1;
    }
    return occurrences;
  }

  if (template.frequency === "MONTHLY") {
    let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    let safety = 0;
    while (!isAfter(cursor, end) && safety < 600) {
      const occurrence = clampDayInMonth(cursor.getFullYear(), cursor.getMonth(), template.referenceDay);
      if (!isBefore(occurrence, start) && !isAfter(occurrence, end) && isWithinTemplateBounds(occurrence, template)) {
        occurrences.push(occurrence);
      }
      cursor = addMonths(cursor, 1);
      safety += 1;
    }
    return occurrences;
  }

  // YEARLY: el mes de la ocurrencia queda anclado al mes de startDate.
  const anchorMonth = template.startDate.getMonth();
  let cursor = new Date(start.getFullYear(), anchorMonth, 1);
  let safety = 0;
  while (!isAfter(cursor, end) && safety < 100) {
    const occurrence = clampDayInMonth(cursor.getFullYear(), anchorMonth, template.referenceDay);
    if (!isBefore(occurrence, start) && !isAfter(occurrence, end) && isWithinTemplateBounds(occurrence, template)) {
      occurrences.push(occurrence);
    }
    cursor = addYears(cursor, 1);
    safety += 1;
  }
  return occurrences;
}
