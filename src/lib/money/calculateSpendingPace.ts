import { Decimal, toDecimal, type DecimalInput } from "./decimal";

export interface SpendingPace {
  averageDailySpend: Decimal;
  dailyLimit: Decimal;
  projectedOverage: Decimal;
  onTrack: boolean;
}

/**
 * Compara el ritmo de gasto libre observado hasta hoy contra lo que
 * realmente queda disponible para el resto del ciclo. Si mantener ese ritmo
 * en los días que faltan superaría el disponible, `projectedOverage` indica
 * cuánto.
 */
export function calculateSpendingPace(
  spentSoFar: DecimalInput,
  daysElapsed: number,
  availableToSpend: DecimalInput,
  daysRemaining: number,
): SpendingPace {
  const averageDailySpend =
    daysElapsed > 0 ? toDecimal(spentSoFar).dividedBy(daysElapsed) : new Decimal(0);

  const dailyLimit =
    daysRemaining > 0
      ? toDecimal(availableToSpend).dividedBy(daysRemaining)
      : toDecimal(availableToSpend);

  const projectedRemainingSpend = averageDailySpend.times(daysRemaining);
  const projectedOverage = Decimal.max(
    projectedRemainingSpend.minus(toDecimal(availableToSpend)),
    0,
  );

  return {
    averageDailySpend,
    dailyLimit,
    projectedOverage,
    onTrack: projectedOverage.lessThanOrEqualTo(0),
  };
}
