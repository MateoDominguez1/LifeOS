import { describe, expect, it } from "vitest";
import { calculateCurrentBudgetPeriod } from "./calculateCurrentBudgetPeriod";

function d(year: number, month: number, day: number) {
  return new Date(year, month - 1, day);
}

describe("calculateCurrentBudgetPeriod", () => {
  it("del ejemplo del spec: sueldo día 15, que en agosto 2026 cae sábado -> se corre al lunes 17", () => {
    // 15 de agosto de 2026 es sábado, así que el cobro real es el lunes 17.
    const { start, end } = calculateCurrentBudgetPeriod(15, d(2026, 8, 17));
    expect(start).toEqual(d(2026, 8, 17));
    expect(end).toEqual(d(2026, 9, 14));
  });

  it("cuando hoy es antes del día de pago, el ciclo empezó el mes anterior", () => {
    const { start, end } = calculateCurrentBudgetPeriod(15, d(2026, 8, 10));
    expect(start).toEqual(d(2026, 7, 15));
    // el pago de agosto también se corre del sábado 15 al lunes 17
    expect(end).toEqual(d(2026, 8, 16));
  });

  it("cuando hoy es exactamente el día de pago (en un día hábil), el ciclo arranca hoy", () => {
    // 15 de julio de 2026 es miércoles: no hay ajuste de fin de semana de por medio.
    const { start } = calculateCurrentBudgetPeriod(15, d(2026, 7, 15));
    expect(start).toEqual(d(2026, 7, 15));
  });

  it("si el día de pago cae sábado, se corre al lunes", () => {
    // 15 de agosto de 2026 es sábado.
    const { start } = calculateCurrentBudgetPeriod(15, d(2026, 8, 17));
    expect(start).toEqual(d(2026, 8, 17));
    expect(start.getDay()).toBe(1); // lunes
  });

  it("si el día de pago cae domingo, se corre al lunes", () => {
    // 1 de noviembre de 2026 es domingo.
    const { start } = calculateCurrentBudgetPeriod(1, d(2026, 11, 2));
    expect(start).toEqual(d(2026, 11, 2));
    expect(start.getDay()).toBe(1); // lunes
  });

  it("clampea el día de pago 31 a los días reales del mes (abril tiene 30)", () => {
    const { start, end } = calculateCurrentBudgetPeriod(31, d(2026, 4, 15));
    expect(start).toEqual(d(2026, 3, 31));
    expect(end).toEqual(d(2026, 4, 29));
  });

  it("clampea el día de pago 31 en febrero, con ajuste de fin de semana en ambos lados", () => {
    // enero 31 de 2026 es sábado -> se corre a lunes 2 de febrero.
    // el clamp de 31 en febrero (28 días) cae el sábado 28 -> se corre a lunes 2 de marzo.
    const { start, end } = calculateCurrentBudgetPeriod(31, d(2026, 2, 20));
    expect(start).toEqual(d(2026, 2, 2));
    expect(end).toEqual(d(2026, 3, 30));
  });

  it("clampea correctamente en febrero bisiesto (sin caer en fin de semana)", () => {
    const { end } = calculateCurrentBudgetPeriod(31, d(2028, 1, 31));
    expect(end).toEqual(d(2028, 2, 28));
  });

  it("maneja el cruce de año", () => {
    const { start, end } = calculateCurrentBudgetPeriod(15, d(2027, 1, 5));
    expect(start).toEqual(d(2026, 12, 15));
    expect(end).toEqual(d(2027, 1, 14));
  });
});
