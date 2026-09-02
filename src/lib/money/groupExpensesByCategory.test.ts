import { describe, expect, it } from "vitest";
import { groupExpensesByCategory } from "./groupExpensesByCategory";

describe("groupExpensesByCategory", () => {
  it("suma gastos por categoría", () => {
    const totals = groupExpensesByCategory([
      { categoryId: "groceries", amount: 50 },
      { categoryId: "groceries", amount: 33 },
      { categoryId: "restaurants", amount: 20 },
    ]);
    const groceries = totals.find((t) => t.categoryId === "groceries");
    const restaurants = totals.find((t) => t.categoryId === "restaurants");
    expect(groceries?.total.toNumber()).toBe(83);
    expect(restaurants?.total.toNumber()).toBe(20);
  });

  it("ignora gastos sin categoría", () => {
    const totals = groupExpensesByCategory([{ categoryId: null, amount: 100 }]);
    expect(totals).toHaveLength(0);
  });

  it("devuelve vacío para una lista vacía", () => {
    expect(groupExpensesByCategory([])).toEqual([]);
  });
});
