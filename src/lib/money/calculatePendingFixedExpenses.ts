import { startOfMonth, startOfWeek, startOfYear } from "date-fns";
import { Decimal, toDecimal, type DecimalInput } from "./decimal";
import { generateOccurrences, type RecurrenceFrequency } from "./generateOccurrences";
import type { BudgetPeriod } from "./calculateCurrentBudgetPeriod";

export interface FixedExpenseLike {
  id: string;
  amount: DecimalInput;
  dueDay: number;
  frequency: RecurrenceFrequency;
  startDate: Date;
  endDate?: Date | null;
  isActive: boolean;
}

export interface PaidTransactionLike {
  fixedExpenseId: string | null;
  date: Date;
}

export interface PendingFixedExpenseItem {
  fixedExpenseId: string;
  dueDate: Date;
  amount: Decimal;
}

/**
 * Agrupa una fecha por "período natural" de su frecuencia (mismo mes, misma
 * semana o mismo año). Se usa para decidir si una transacción ya pagada
 * corresponde a una ocurrencia concreta, sin exigir que la fecha de pago
 * coincida exactamente con el día de vencimiento.
 */
function bucketKey(date: Date, frequency: RecurrenceFrequency): string {
  switch (frequency) {
    case "WEEKLY":
      return startOfWeek(date, { weekStartsOn: 1 }).toISOString();
    case "YEARLY":
      return startOfYear(date).toISOString();
    case "MONTHLY":
    default:
      return startOfMonth(date).toISOString();
  }
}

/**
 * Suma los gastos fijos que caen dentro del ciclo actual y todavía no fueron
 * pagados. Esto ES el "dinero reservado para gastos fijos": no depende de si
 * la fecha de vencimiento ya pasó respecto a hoy, sino de si ya se pagó.
 */
export function calculatePendingFixedExpenses(
  fixedExpenses: FixedExpenseLike[],
  transactions: PaidTransactionLike[],
  period: BudgetPeriod,
): { items: PendingFixedExpenseItem[]; total: Decimal } {
  const items: PendingFixedExpenseItem[] = [];

  for (const expense of fixedExpenses) {
    if (!expense.isActive) continue;

    const occurrences = generateOccurrences(
      {
        referenceDay: expense.dueDay,
        frequency: expense.frequency,
        startDate: expense.startDate,
        endDate: expense.endDate,
      },
      period.start,
      period.end,
    );

    const paidBuckets = new Set(
      transactions
        .filter((tx) => tx.fixedExpenseId === expense.id)
        .map((tx) => bucketKey(tx.date, expense.frequency)),
    );

    for (const occurrence of occurrences) {
      if (paidBuckets.has(bucketKey(occurrence, expense.frequency))) continue;
      items.push({
        fixedExpenseId: expense.id,
        dueDate: occurrence,
        amount: toDecimal(expense.amount),
      });
    }
  }

  const total = items.reduce((sum, item) => sum.plus(item.amount), new Decimal(0));
  return { items, total };
}
