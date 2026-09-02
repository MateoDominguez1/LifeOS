import { Decimal, toDecimal, type DecimalInput } from "./decimal";

/**
 * Disponible para gastar = saldo total
 *   - reservado para gastos fijos pendientes
 *   - presupuestos restantes (supermercado + otros)
 *
 * Un presupuesto sobregastado (remaining negativo) no devuelve dinero: ese
 * dinero ya salió del saldo vía transacciones, así que se trata como 0 en
 * vez de sumarlo de vuelta al disponible.
 */
export function calculateAvailableToSpend(
  totalBalance: DecimalInput,
  reservedForFixedExpenses: DecimalInput,
  budgetsRemaining: DecimalInput[],
): Decimal {
  const reservedBudgets = budgetsRemaining.reduce(
    (sum: Decimal, remaining) => sum.plus(Decimal.max(toDecimal(remaining), 0)),
    new Decimal(0),
  );

  return toDecimal(totalBalance)
    .minus(toDecimal(reservedForFixedExpenses))
    .minus(reservedBudgets);
}
