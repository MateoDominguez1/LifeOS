import { describe, expect, it } from "vitest";
import { calculateBudgetProgress, type BudgetLike, type CategorizedExpenseLike } from "./calculateBudgetProgress";

function d(year: number, month: number, day: number) {
  return new Date(year, month - 1, day);
}

const period = { start: d(2026, 8, 15), end: d(2026, 9, 14) };

describe("calculateBudgetProgress", () => {
  it("reproduce el ejemplo del spec: presupuesto 200, gastado 83, restante 117", () => {
    const budget: BudgetLike = {
      id: "b1",
      categoryId: "groceries",
      monthlyAmount: 200,
      weeklyAmount: null,
      weekStartDay: null,
      isActive: true,
    };
    const expenses: CategorizedExpenseLike[] = [
      { categoryId: "groceries", accountId: "acc1", amount: 50, date: d(2026, 8, 16) },
      { categoryId: "groceries", accountId: "acc1", amount: 33, date: d(2026, 8, 20) },
      { categoryId: "restaurants", accountId: "acc1", amount: 999, date: d(2026, 8, 20) },
    ];

    const { monthly } = calculateBudgetProgress(budget, expenses, period, d(2026, 8, 20));
    expect(monthly.spent.toNumber()).toBe(83);
    expect(monthly.remaining.toNumber()).toBe(117);
  });

  it("calcula el bucket semanal cuando el presupuesto define weeklyAmount", () => {
    const budget: BudgetLike = {
      id: "b1",
      categoryId: "groceries",
      monthlyAmount: 200,
      weeklyAmount: 50,
      weekStartDay: 1, // lunes
      isActive: true,
    };
    // "hoy" jueves 20 de agosto de 2026 -> semana lunes 17 a domingo 23
    const expenses: CategorizedExpenseLike[] = [
      { categoryId: "groceries", accountId: "acc1", amount: 20, date: d(2026, 8, 18) },
      { categoryId: "groceries", accountId: "acc1", amount: 12, date: d(2026, 8, 19) },
      { categoryId: "groceries", accountId: "acc1", amount: 40, date: d(2026, 8, 10) }, // semana anterior, no cuenta
    ];

    const { weekly } = calculateBudgetProgress(budget, expenses, period, d(2026, 8, 20));
    expect(weekly?.spent.toNumber()).toBe(32);
    expect(weekly?.remaining.toNumber()).toBe(18);
  });

  it("no calcula bucket semanal si el presupuesto no define weeklyAmount", () => {
    const budget: BudgetLike = {
      id: "b1",
      categoryId: "groceries",
      monthlyAmount: 200,
      weeklyAmount: null,
      weekStartDay: null,
      isActive: true,
    };
    const { weekly } = calculateBudgetProgress(budget, [], period, d(2026, 8, 20));
    expect(weekly).toBeNull();
  });

  it("ignora gastos de otras categorías", () => {
    const budget: BudgetLike = {
      id: "b1",
      categoryId: "groceries",
      monthlyAmount: 200,
      weeklyAmount: null,
      weekStartDay: null,
      isActive: true,
    };
    const expenses: CategorizedExpenseLike[] = [
      { categoryId: "restaurants", accountId: "acc1", amount: 100, date: d(2026, 8, 20) },
    ];
    const { monthly } = calculateBudgetProgress(budget, expenses, period, d(2026, 8, 20));
    expect(monthly.spent.toNumber()).toBe(0);
  });

  it("permite remaining negativo cuando el presupuesto está sobregastado", () => {
    const budget: BudgetLike = {
      id: "b1",
      categoryId: "groceries",
      monthlyAmount: 100,
      weeklyAmount: null,
      weekStartDay: null,
      isActive: true,
    };
    const expenses: CategorizedExpenseLike[] = [
      { categoryId: "groceries", accountId: "acc1", amount: 150, date: d(2026, 8, 20) },
    ];
    const { monthly } = calculateBudgetProgress(budget, expenses, period, d(2026, 8, 20));
    expect(monthly.remaining.toNumber()).toBe(-50);
  });

  it("cuando el presupuesto tiene accountId, cuenta gastos pagados desde esa cuenta aunque la categoría no coincida", () => {
    // Ej.: la cuenta de supermercado es exclusiva para eso, así que todo lo
    // que sale de ahí es gasto de supermercado aunque haya quedado
    // categorizado distinto (o sin categoría).
    const budget: BudgetLike = {
      id: "b1",
      categoryId: "groceries",
      accountId: "cuenta-super",
      monthlyAmount: 200,
      weeklyAmount: null,
      weekStartDay: null,
      isActive: true,
    };
    const expenses: CategorizedExpenseLike[] = [
      { categoryId: "restaurants", accountId: "cuenta-super", amount: 30, date: d(2026, 8, 16) },
      { categoryId: null, accountId: "cuenta-super", amount: 20, date: d(2026, 8, 17) },
    ];
    const { monthly } = calculateBudgetProgress(budget, expenses, period, d(2026, 8, 20));
    expect(monthly.spent.toNumber()).toBe(50);
  });

  it("cuando el presupuesto tiene accountId, también cuenta gastos de su categoría pagados desde otra cuenta", () => {
    const budget: BudgetLike = {
      id: "b1",
      categoryId: "groceries",
      accountId: "cuenta-super",
      monthlyAmount: 200,
      weeklyAmount: null,
      weekStartDay: null,
      isActive: true,
    };
    const expenses: CategorizedExpenseLike[] = [
      { categoryId: "groceries", accountId: "cuenta-super", amount: 50, date: d(2026, 8, 16) },
      { categoryId: "groceries", accountId: "cuenta-principal", amount: 30, date: d(2026, 8, 17) },
    ];
    const { monthly } = calculateBudgetProgress(budget, expenses, period, d(2026, 8, 20));
    expect(monthly.spent.toNumber()).toBe(80);
  });

  it("cuando el presupuesto tiene accountId, ignora gastos que no coinciden ni en categoría ni en cuenta", () => {
    const budget: BudgetLike = {
      id: "b1",
      categoryId: "groceries",
      accountId: "cuenta-super",
      monthlyAmount: 200,
      weeklyAmount: null,
      weekStartDay: null,
      isActive: true,
    };
    const expenses: CategorizedExpenseLike[] = [
      { categoryId: "restaurants", accountId: "cuenta-principal", amount: 999, date: d(2026, 8, 17) },
    ];
    const { monthly } = calculateBudgetProgress(budget, expenses, period, d(2026, 8, 20));
    expect(monthly.spent.toNumber()).toBe(0);
  });

  it("sin accountId en el presupuesto, cuenta gastos de cualquier cuenta", () => {
    const budget: BudgetLike = {
      id: "b1",
      categoryId: "groceries",
      accountId: null,
      monthlyAmount: 200,
      weeklyAmount: null,
      weekStartDay: null,
      isActive: true,
    };
    const expenses: CategorizedExpenseLike[] = [
      { categoryId: "groceries", accountId: "cuenta-super", amount: 50, date: d(2026, 8, 16) },
      { categoryId: "groceries", accountId: "cuenta-principal", amount: 30, date: d(2026, 8, 17) },
    ];
    const { monthly } = calculateBudgetProgress(budget, expenses, period, d(2026, 8, 20));
    expect(monthly.spent.toNumber()).toBe(80);
  });
});
