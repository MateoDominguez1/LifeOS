import { describe, expect, it } from "vitest";
import { calculateProjectedBalance, type ProjectedIncomeLike } from "./calculateProjectedBalance";
import type { FixedExpenseLike } from "./calculatePendingFixedExpenses";

function d(year: number, month: number, day: number) {
  return new Date(year, month - 1, day);
}

describe("calculateProjectedBalance", () => {
  it("reproduce el ejemplo del spec: 1200 + 1500 - 900 = 1800", () => {
    const today = d(2026, 8, 10);
    const horizon = d(2026, 9, 9); // 30 días

    const incomes: ProjectedIncomeLike[] = [
      { amount: 1500, dayOfMonth: 15, frequency: "MONTHLY", createdAt: d(2020, 1, 1), isActive: true },
    ];
    const fixedExpenses: FixedExpenseLike[] = [
      { id: "rent", amount: 600, dueDay: 1, frequency: "MONTHLY", startDate: d(2020, 1, 1), isActive: true },
      { id: "phone", amount: 300, dueDay: 20, frequency: "MONTHLY", startDate: d(2020, 1, 1), isActive: true },
    ];

    const result = calculateProjectedBalance(1200, incomes, fixedExpenses, [], today, horizon);
    expect(result.toNumber()).toBe(1800);
  });

  it("no cuenta un gasto fijo que ya fue pagado dentro de la ventana", () => {
    const today = d(2026, 8, 10);
    const horizon = d(2026, 8, 31);
    const fixedExpenses: FixedExpenseLike[] = [
      { id: "netflix", amount: 15, dueDay: 20, frequency: "MONTHLY", startDate: d(2020, 1, 1), isActive: true },
    ];

    const result = calculateProjectedBalance(
      1000,
      [],
      fixedExpenses,
      [{ fixedExpenseId: "netflix", date: d(2026, 8, 20) }],
      today,
      horizon,
    );
    expect(result.toNumber()).toBe(1000);
  });

  it("no proyecta ingresos ni gastos fuera del horizonte", () => {
    const today = d(2026, 8, 10);
    const horizon = d(2026, 8, 15); // horizonte corto, no llega al día 20

    const incomes: ProjectedIncomeLike[] = [
      { amount: 1500, dayOfMonth: 25, frequency: "MONTHLY", createdAt: d(2020, 1, 1), isActive: true },
    ];
    const fixedExpenses: FixedExpenseLike[] = [
      { id: "netflix", amount: 15, dueDay: 20, frequency: "MONTHLY", startDate: d(2020, 1, 1), isActive: true },
    ];

    const result = calculateProjectedBalance(1000, incomes, fixedExpenses, [], today, horizon);
    expect(result.toNumber()).toBe(1000);
  });

  it("ignora ingresos y gastos fijos inactivos", () => {
    const today = d(2026, 8, 10);
    const horizon = d(2026, 9, 9);
    const incomes: ProjectedIncomeLike[] = [
      { amount: 1500, dayOfMonth: 15, frequency: "MONTHLY", createdAt: d(2020, 1, 1), isActive: false },
    ];
    const result = calculateProjectedBalance(1000, incomes, [], [], today, horizon);
    expect(result.toNumber()).toBe(1000);
  });

  it("no proyecta un ingreso variable (amount null): resta gastos fijos pero no inventa el sueldo", () => {
    const today = d(2026, 8, 10);
    const horizon = d(2026, 9, 9);
    const incomes: ProjectedIncomeLike[] = [
      { amount: null, dayOfMonth: 15, frequency: "MONTHLY", createdAt: d(2020, 1, 1), isActive: true },
    ];
    const fixedExpenses: FixedExpenseLike[] = [
      { id: "rent", amount: 600, dueDay: 1, frequency: "MONTHLY", startDate: d(2020, 1, 1), isActive: true },
    ];
    const result = calculateProjectedBalance(1200, incomes, fixedExpenses, [], today, horizon);
    expect(result.toNumber()).toBe(600);
  });
});
