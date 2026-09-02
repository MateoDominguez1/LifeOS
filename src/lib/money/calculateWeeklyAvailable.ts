import { addDays, differenceInCalendarDays, endOfWeek, startOfDay, type Day } from "date-fns";
import { Decimal, toDecimal, type DecimalInput } from "./decimal";
import type { BudgetPeriod } from "./calculateCurrentBudgetPeriod";

export interface WeeklyMovementLike {
  /** Positivo para gastos libres (reduce el disponible de esa semana);
   * negativo para ingresos puntuales no recurrentes (lo aumenta). */
  amount: DecimalInput;
  date: Date;
}

export interface WeeklyAvailable {
  /** Disponible del ciclo repartido en partes iguales entre sus semanas, sin ajustar. */
  baseWeeklyAmount: Decimal;
  /** Suma de lo que sobró (positivo) o faltó (negativo) en las semanas ya
   * cerradas de este ciclo, respecto a `baseWeeklyAmount`. */
  carryover: Decimal;
  /** baseWeeklyAmount + carryover: lo que corresponde gastar esta semana. */
  weeklyBudget: Decimal;
  /** Movimiento neto de la semana de calendario en curso (gastos menos
   * cualquier ingreso puntual recibido esa misma semana). */
  spent: Decimal;
  /** weeklyBudget - spent. */
  remaining: Decimal;
  daysLeftInWeek: number;
}

/**
 * Presupuesto semanal alineado a semanas de calendario (lunes a domingo por
 * defecto) en vez de un promedio continuo día a día. Cada semana arranca con
 * la misma base (disponible total del ciclo dividido entre sus semanas), y
 * lo que sobra o falta en una semana ya cerrada se traslada explícitamente a
 * las siguientes — así el usuario ve un motivo concreto cuando el número
 * cambia ("te sobraron €40 la semana pasada"), en vez de una redistribución
 * silenciosa. Las semanas parciales en los bordes del ciclo cuentan como una
 * semana entera a efectos de repartir la base.
 *
 * `movements` también puede incluir ingresos puntuales no recurrentes (con
 * monto negativo): quedan acreditados enteros a la semana en que llegaron,
 * en vez de licuarse en partes chiquitas a lo largo de todo el ciclo — el
 * llamador es responsable de sacar ese mismo ingreso de
 * `totalDiscretionaryForCycle` para no contarlo dos veces (ver dashboard).
 */
export function calculateWeeklyAvailable(
  totalDiscretionaryForCycle: DecimalInput,
  movements: WeeklyMovementLike[],
  period: BudgetPeriod,
  today: Date,
  weekStartDay: number = 1,
): WeeklyAvailable {
  const weekStartsOn = weekStartDay as Day;
  const todayStart = startOfDay(today);
  const periodStart = startOfDay(period.start);
  const periodEnd = startOfDay(period.end);

  const weeks: { start: Date; end: Date }[] = [];
  let cursor = periodStart;
  while (cursor <= periodEnd) {
    // startOfDay normaliza el 23:59:59.999 que devuelve endOfWeek, para que
    // todas las fechas de esta función queden a medianoche y las
    // comparaciones con `todayStart` (también a medianoche) sean exactas.
    const rawWeekEnd = startOfDay(endOfWeek(cursor, { weekStartsOn }));
    const weekEnd = rawWeekEnd < periodEnd ? rawWeekEnd : periodEnd;
    weeks.push({ start: cursor, end: weekEnd });
    cursor = startOfDay(addDays(weekEnd, 1));
  }

  const numberOfWeeks = Math.max(weeks.length, 1);
  const baseWeeklyAmount = toDecimal(totalDiscretionaryForCycle).dividedBy(numberOfWeeks);

  const sumInRange = (start: Date, end: Date) =>
    movements
      .filter((movement) => {
        const day = startOfDay(movement.date);
        return day >= start && day <= end;
      })
      .reduce((sum, movement) => sum.plus(toDecimal(movement.amount)), new Decimal(0));

  let carryover = new Decimal(0);
  let currentWeek = weeks[weeks.length - 1];
  for (const week of weeks) {
    if (todayStart >= week.start && todayStart <= week.end) {
      currentWeek = week;
      break;
    }
    if (todayStart > week.end) {
      const spentThatWeek = sumInRange(week.start, week.end);
      carryover = carryover.plus(baseWeeklyAmount.minus(spentThatWeek));
    }
  }

  const spent = sumInRange(currentWeek.start, currentWeek.end);
  const weeklyBudget = baseWeeklyAmount.plus(carryover);
  const remaining = weeklyBudget.minus(spent);
  const daysLeftInWeek = Math.max(differenceInCalendarDays(currentWeek.end, todayStart) + 1, 1);

  return { baseWeeklyAmount, carryover, weeklyBudget, spent, remaining, daysLeftInWeek };
}
