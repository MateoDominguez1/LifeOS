import { describe, expect, it } from "vitest";
import { calculatePendingFixedExpenses, type FixedExpenseLike } from "./calculatePendingFixedExpenses";

function d(year: number, month: number, day: number) {
  return new Date(year, month - 1, day);
}

const period = { start: d(2026, 8, 15), end: d(2026, 9, 14) };

function expense(overrides: Partial<FixedExpenseLike> & { id: string }): FixedExpenseLike {
  return {
    amount: 0,
    dueDay: 1,
    frequency: "MONTHLY",
    startDate: d(2020, 1, 1),
    endDate: null,
    isActive: true,
    ...overrides,
  };
}

describe("calculatePendingFixedExpenses", () => {
  it("reproduce el ejemplo del spec: alquiler + netflix + teléfono = 645", () => {
    const fixedExpenses: FixedExpenseLike[] = [
      expense({ id: "rent", amount: 600, dueDay: 1 }),
      expense({ id: "netflix", amount: 15, dueDay: 20 }),
      expense({ id: "phone", amount: 30, dueDay: 25 }),
    ];

    const { total, items } = calculatePendingFixedExpenses(fixedExpenses, [], period);
    expect(total.toNumber()).toBe(645);
    expect(items).toHaveLength(3);
  });

  it("un gasto ya pagado (transacción en el mismo mes) no se vuelve a reservar", () => {
    const fixedExpenses: FixedExpenseLike[] = [expense({ id: "netflix", amount: 15, dueDay: 20 })];

    const { total } = calculatePendingFixedExpenses(
      fixedExpenses,
      [{ fixedExpenseId: "netflix", date: d(2026, 8, 21) }],
      period,
    );
    expect(total.toNumber()).toBe(0);
  });

  it("ignora gastos fijos inactivos", () => {
    const fixedExpenses: FixedExpenseLike[] = [
      expense({ id: "gym", amount: 35, dueDay: 10, isActive: false }),
    ];
    const { total } = calculatePendingFixedExpenses(fixedExpenses, [], period);
    expect(total.toNumber()).toBe(0);
  });

  it("una ocurrencia vencida y no pagada sigue reservada, sin importar la fecha de hoy", () => {
    // dueDay 1 -> ocurrencia dentro del período es el 1 de septiembre, que ya
    // pasó respecto al "hoy" del ejemplo (18 de agosto no aplica acá porque
    // esta función no recibe "hoy": lo importante es que no esté pagada).
    const fixedExpenses: FixedExpenseLike[] = [expense({ id: "rent", amount: 600, dueDay: 1 })];
    const { total } = calculatePendingFixedExpenses(fixedExpenses, [], period);
    expect(total.toNumber()).toBe(600);
  });

  it("una transacción de otro gasto fijo no marca este como pagado", () => {
    const fixedExpenses: FixedExpenseLike[] = [expense({ id: "netflix", amount: 15, dueDay: 20 })];
    const { total } = calculatePendingFixedExpenses(
      fixedExpenses,
      [{ fixedExpenseId: "phone", date: d(2026, 8, 21) }],
      period,
    );
    expect(total.toNumber()).toBe(15);
  });
});
