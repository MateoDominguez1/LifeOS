import { endOfWeek, isAfter, isBefore, startOfDay, startOfWeek, type Day } from "date-fns";
import { Decimal, toDecimal, type DecimalInput } from "./decimal";
import type { BudgetPeriod } from "./calculateCurrentBudgetPeriod";

export interface BudgetLike {
  id: string;
  categoryId: string;
  /** Cuenta de la que se descuenta este presupuesto. Si es null, cuenta el gasto sin importar la cuenta. */
  accountId?: string | null;
  monthlyAmount: DecimalInput;
  weeklyAmount?: DecimalInput | null;
  weekStartDay?: number | null;
  isActive: boolean;
}

export interface CategorizedExpenseLike {
  categoryId: string | null;
  accountId: string;
  amount: DecimalInput;
  date: Date;
}

export interface BudgetBucketProgress {
  budgetAmount: Decimal;
  spent: Decimal;
  remaining: Decimal;
}

export interface BudgetProgress {
  monthly: BudgetBucketProgress;
  weekly: BudgetBucketProgress | null;
}

function sumInRange(expenses: CategorizedExpenseLike[], start: Date, end: Date): Decimal {
  const rangeStart = startOfDay(start);
  const rangeEnd = startOfDay(end);
  return expenses
    .filter((expense) => {
      const day = startOfDay(expense.date);
      return !isBefore(day, rangeStart) && !isAfter(day, rangeEnd);
    })
    .reduce((sum, expense) => sum.plus(toDecimal(expense.amount)), new Decimal(0));
}

/**
 * Progreso de un presupuesto (supermercado u otro) dentro del ciclo actual,
 * y opcionalmente dentro de la semana en curso si el presupuesto define un
 * límite semanal. Un gasto cuenta para el presupuesto si coincide su
 * categoría, O si se pagó desde la cuenta dedicada del presupuesto (cuando
 * tiene una) — así, si esa cuenta es exclusiva para un fin (ej.: el
 * supermercado que paga la madre del usuario), todo lo que sale de ahí se
 * descuenta del presupuesto aunque el gasto haya quedado mal categorizado.
 * El dinero de un presupuesto es independiente del dinero libre: por eso
 * `remaining` se calcula acá y quien llama decide cómo restarlo del disponible.
 */
export function calculateBudgetProgress(
  budget: BudgetLike,
  expenses: CategorizedExpenseLike[],
  period: BudgetPeriod,
  today: Date,
): BudgetProgress {
  const categoryExpenses = expenses.filter(
    (expense) =>
      expense.categoryId === budget.categoryId ||
      (budget.accountId != null && expense.accountId === budget.accountId),
  );

  const monthlySpent = sumInRange(categoryExpenses, period.start, period.end);
  const monthlyBudget = toDecimal(budget.monthlyAmount);
  const monthly: BudgetBucketProgress = {
    budgetAmount: monthlyBudget,
    spent: monthlySpent,
    remaining: monthlyBudget.minus(monthlySpent),
  };

  let weekly: BudgetBucketProgress | null = null;
  if (budget.weeklyAmount != null && budget.weekStartDay != null) {
    const weekStartsOn = budget.weekStartDay as Day;
    const weekStart = startOfWeek(today, { weekStartsOn });
    const weekEnd = endOfWeek(today, { weekStartsOn });
    const weeklySpent = sumInRange(categoryExpenses, weekStart, weekEnd);
    const weeklyBudget = toDecimal(budget.weeklyAmount);
    weekly = {
      budgetAmount: weeklyBudget,
      spent: weeklySpent,
      remaining: weeklyBudget.minus(weeklySpent),
    };
  }

  return { monthly, weekly };
}
