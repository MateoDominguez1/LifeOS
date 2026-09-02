import { subDays } from "date-fns";
import { calculateCurrentBudgetPeriod, type BudgetPeriod } from "./calculateCurrentBudgetPeriod";

/**
 * Devuelve los últimos `count` ciclos de presupuesto, empezando por el
 * actual (índice 0) y retrocediendo uno por uno.
 */
export function getRecentBudgetPeriods(
  paydayDay: number,
  referenceDate: Date,
  count: number,
): BudgetPeriod[] {
  const periods: BudgetPeriod[] = [];
  let cursor = referenceDate;

  for (let i = 0; i < count; i++) {
    const period = calculateCurrentBudgetPeriod(paydayDay, cursor);
    periods.push(period);
    cursor = subDays(period.start, 1);
  }

  return periods;
}
