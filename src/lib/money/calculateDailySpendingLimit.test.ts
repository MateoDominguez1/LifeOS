import { describe, expect, it } from "vitest";
import { calculateDailySpendingLimit } from "./calculateDailySpendingLimit";

function d(year: number, month: number, day: number) {
  return new Date(year, month - 1, day);
}

describe("calculateDailySpendingLimit", () => {
  it("reproduce el ejemplo del spec: 600 disponible / 20 días = 30/día", () => {
    const period = { start: d(2026, 8, 1), end: d(2026, 8, 30) };
    // "hoy" tal que queden exactamente 20 días (incluyendo hoy): del 11 al 30 son 20 días
    const limit = calculateDailySpendingLimit(600, period, d(2026, 8, 11));
    expect(limit.toNumber()).toBe(30);
  });

  it("reproduce el ejemplo de la sección 27: 820 disponible, 20 días -> 41/día", () => {
    const period = { start: d(2026, 8, 15), end: d(2026, 9, 14) };
    const limit = calculateDailySpendingLimit(820, period, d(2026, 8, 26));
    expect(limit.toNumber()).toBe(41);
  });

  it("cuenta el día de hoy como parte de los días restantes", () => {
    const period = { start: d(2026, 8, 1), end: d(2026, 8, 1) };
    const limit = calculateDailySpendingLimit(100, period, d(2026, 8, 1));
    expect(limit.toNumber()).toBe(100);
  });

  it("nunca divide por menos de 1 día, incluso después del fin del ciclo", () => {
    const period = { start: d(2026, 8, 1), end: d(2026, 8, 1) };
    const limit = calculateDailySpendingLimit(100, period, d(2026, 8, 5));
    expect(limit.toNumber()).toBe(100);
  });

  it("recalcula automáticamente al bajar el disponible tras un gasto", () => {
    const period = { start: d(2026, 8, 15), end: d(2026, 9, 14) };
    const today = d(2026, 8, 26);
    const before = calculateDailySpendingLimit(820, period, today);
    const after = calculateDailySpendingLimit(770, period, today);
    expect(before.toNumber()).toBe(41);
    expect(after.toNumber()).toBe(38.5);
  });
});
