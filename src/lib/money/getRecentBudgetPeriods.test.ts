import { describe, expect, it } from "vitest";
import { getRecentBudgetPeriods } from "./getRecentBudgetPeriods";

function d(year: number, month: number, day: number) {
  return new Date(year, month - 1, day);
}

describe("getRecentBudgetPeriods", () => {
  it("devuelve el ciclo actual y los anteriores sin solaparse", () => {
    const periods = getRecentBudgetPeriods(15, d(2026, 8, 17), 3);
    expect(periods).toEqual([
      // el 15 de agosto de 2026 es sábado -> el cobro real es el lunes 17
      { start: d(2026, 8, 17), end: d(2026, 9, 14) },
      { start: d(2026, 7, 15), end: d(2026, 8, 16) },
      { start: d(2026, 6, 15), end: d(2026, 7, 14) },
    ]);
  });

  it("maneja el cruce de año", () => {
    const periods = getRecentBudgetPeriods(15, d(2027, 1, 5), 2);
    expect(periods).toEqual([
      { start: d(2026, 12, 15), end: d(2027, 1, 14) },
      // el 15 de noviembre de 2026 es domingo -> el cobro real es el lunes 16
      { start: d(2026, 11, 16), end: d(2026, 12, 14) },
    ]);
  });
});
