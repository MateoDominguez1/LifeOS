import { Decimal, toDecimal, type DecimalInput } from "./decimal";

export interface CategoryTotal {
  categoryId: string;
  total: Decimal;
}

export interface CategorizedAmountLike {
  categoryId: string | null;
  amount: DecimalInput;
}

/** Suma los gastos por categoría, ignorando los que no tienen categoría asignada. */
export function groupExpensesByCategory(expenses: CategorizedAmountLike[]): CategoryTotal[] {
  const totals = new Map<string, Decimal>();

  for (const expense of expenses) {
    if (!expense.categoryId) continue;
    const current = totals.get(expense.categoryId) ?? new Decimal(0);
    totals.set(expense.categoryId, current.plus(toDecimal(expense.amount)));
  }

  return Array.from(totals.entries()).map(([categoryId, total]) => ({ categoryId, total }));
}
