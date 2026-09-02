import { differenceInCalendarDays, startOfDay } from "date-fns";
import { Decimal, toDecimal, type DecimalInput } from "./decimal";
import type { BudgetPeriod } from "./calculateCurrentBudgetPeriod";

/**
 * Cuánto se puede gastar por día para llegar al próximo sueldo sin
 * comprometer el disponible. Los días restantes incluyen el día de hoy.
 */
export function calculateDailySpendingLimit(
  availableToSpend: DecimalInput,
  period: BudgetPeriod,
  today: Date,
): Decimal {
  const daysRemaining = Math.max(
    differenceInCalendarDays(period.end, startOfDay(today)) + 1,
    1,
  );

  return toDecimal(availableToSpend).dividedBy(daysRemaining);
}
