import { addDays, addMonths, isBefore, lastDayOfMonth, setDate, startOfDay, subDays, subMonths } from "date-fns";

export interface BudgetPeriod {
  start: Date;
  end: Date;
}

/**
 * Los bancos no depositan sueldos en fin de semana: si el día de pago cae
 * sábado o domingo, el cobro real se corre al lunes siguiente.
 */
function adjustToBusinessDay(date: Date): Date {
  const weekday = date.getDay();
  if (weekday === 6) return addDays(date, 2); // sábado -> lunes
  if (weekday === 0) return addDays(date, 1); // domingo -> lunes
  return date;
}

/**
 * Ubica el día de pago dentro del mes de `monthAnchor`, clampeando al último
 * día del mes cuando `paydayDay` no existe en ese mes (ej. 31 en febrero), y
 * corriéndolo al lunes si cae en fin de semana. Solo se usa el año/mes de
 * `monthAnchor`; su día se ignora.
 */
function paydayInMonthOf(monthAnchor: Date, paydayDay: number): Date {
  const daysInMonth = lastDayOfMonth(monthAnchor).getDate();
  const clampedDay = Math.min(Math.max(paydayDay, 1), daysInMonth);
  const rawPayday = setDate(startOfDay(monthAnchor), clampedDay);
  return adjustToBusinessDay(rawPayday);
}

/**
 * El ciclo financiero no coincide con el mes calendario: arranca el día de
 * cobro del sueldo y termina el día anterior al próximo cobro. Si el día de
 * cobro cae en fin de semana, se corre al lunes (así llega el sueldo).
 * Ej.: paydayDay=15, referenceDate=17 de agosto → { 15 agosto, 14 septiembre }.
 */
export function calculateCurrentBudgetPeriod(
  paydayDay: number,
  referenceDate: Date,
): BudgetPeriod {
  const ref = startOfDay(referenceDate);
  const thisMonthPayday = paydayInMonthOf(ref, paydayDay);

  const start = isBefore(ref, thisMonthPayday)
    ? paydayInMonthOf(subMonths(ref, 1), paydayDay)
    : thisMonthPayday;

  const nextPayday = paydayInMonthOf(addMonths(start, 1), paydayDay);
  const end = subDays(nextPayday, 1);

  return { start, end };
}
