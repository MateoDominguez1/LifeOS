import { addDays, startOfDay } from "date-fns";
import { Decimal, toDecimal, type DecimalInput } from "./decimal";
import { generateOccurrences, type RecurrenceFrequency } from "./generateOccurrences";
import { calculatePendingFixedExpenses, type FixedExpenseLike, type PaidTransactionLike } from "./calculatePendingFixedExpenses";

export interface ProjectedIncomeLike {
  /** null cuando el ingreso es variable (no se sabe el monto de antemano). */
  amount: DecimalInput | null;
  dayOfMonth: number;
  frequency: RecurrenceFrequency;
  /** El ingreso no tiene fecha de inicio propia; se usa la fecha de creación de la plantilla. */
  createdAt: Date;
  isActive: boolean;
}

/**
 * Proyecta el saldo dentro de `horizonDate` sumando los ingresos futuros
 * esperados y restando los gastos fijos pendientes en la ventana
 * (mañana, horizonDate]. Reutiliza calculatePendingFixedExpenses para no
 * duplicar la lógica de "ya pagado vs. pendiente". Los ingresos variables
 * (amount = null) no se pueden proyectar sin inventar un número, así que se
 * excluyen: la proyección queda más conservadora en vez de adivinar.
 */
export function calculateProjectedBalance(
  currentBalance: DecimalInput,
  incomes: ProjectedIncomeLike[],
  fixedExpenses: FixedExpenseLike[],
  fixedExpenseTransactions: PaidTransactionLike[],
  today: Date,
  horizonDate: Date,
): Decimal {
  const rangeStart = addDays(startOfDay(today), 1);
  const rangeEnd = startOfDay(horizonDate);

  const futureIncome = incomes
    .filter((income) => income.isActive && income.amount !== null)
    .reduce((sum, income) => {
      const occurrences = generateOccurrences(
        { referenceDay: income.dayOfMonth, frequency: income.frequency, startDate: income.createdAt },
        rangeStart,
        rangeEnd,
      );
      return sum.plus(toDecimal(income.amount as DecimalInput).times(occurrences.length));
    }, new Decimal(0));

  const pendingExpenses = calculatePendingFixedExpenses(fixedExpenses, fixedExpenseTransactions, {
    start: rangeStart,
    end: rangeEnd,
  });

  return toDecimal(currentBalance).plus(futureIncome).minus(pendingExpenses.total);
}
