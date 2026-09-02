import { describe, expect, it } from "vitest";
import { calculateWeeklyAvailable, type WeeklyMovementLike } from "./calculateWeeklyAvailable";

function d(year: number, month: number, day: number) {
  return new Date(year, month - 1, day);
}

function expense(amount: number, year: number, month: number, day: number): WeeklyMovementLike {
  return { amount, date: d(year, month, day) };
}

function income(amount: number, year: number, month: number, day: number): WeeklyMovementLike {
  return { amount: -amount, date: d(year, month, day) };
}

// Lunes 3 de agosto a domingo 30 de agosto de 2026: exactamente 4 semanas
// completas (lun-dom), sin semanas parciales en los bordes.
const period = { start: d(2026, 8, 3), end: d(2026, 8, 30) };

describe("calculateWeeklyAvailable", () => {
  it("reparte el disponible en partes iguales entre las semanas del ciclo", () => {
    const result = calculateWeeklyAvailable(800, [], period, d(2026, 8, 10), 1);
    expect(result.baseWeeklyAmount.toNumber()).toBe(200);
  });

  it("sin gasto en la semana pasada, la traslada entera como sobrante", () => {
    // Hoy lunes 10 (arranca semana 2): la semana 1 (3-9 ago) ya cerró sin gasto.
    const result = calculateWeeklyAvailable(800, [], period, d(2026, 8, 10), 1);
    expect(result.carryover.toNumber()).toBe(200);
    expect(result.weeklyBudget.toNumber()).toBe(400);
    expect(result.daysLeftInWeek).toBe(7);
  });

  it("si gastaste menos que la base la semana pasada, el sobrante se suma", () => {
    const expenses = [expense(150, 2026, 8, 5)]; // semana 1: gastó 150 de 200
    const result = calculateWeeklyAvailable(800, expenses, period, d(2026, 8, 10), 1);
    expect(result.carryover.toNumber()).toBe(50);
    expect(result.weeklyBudget.toNumber()).toBe(250);
  });

  it("si te pasaste la semana pasada, el faltante se resta de esta semana", () => {
    const expenses = [expense(280, 2026, 8, 5)]; // semana 1: gastó 280 de 200 (80 de más)
    const result = calculateWeeklyAvailable(800, expenses, period, d(2026, 8, 10), 1);
    expect(result.carryover.toNumber()).toBe(-80);
    expect(result.weeklyBudget.toNumber()).toBe(120);
  });

  it("acumula el arrastre de varias semanas ya cerradas", () => {
    const expenses = [
      expense(150, 2026, 8, 5), // semana 1: ahorró 50
      expense(250, 2026, 8, 12), // semana 2: se pasó 50
    ];
    // Hoy en semana 3 (17-23 ago): semanas 1 y 2 ya cerraron.
    const result = calculateWeeklyAvailable(800, expenses, period, d(2026, 8, 20), 1);
    expect(result.carryover.toNumber()).toBe(0); // +50 y -50 se cancelan
    expect(result.weeklyBudget.toNumber()).toBe(200);
  });

  it("en la primera semana del ciclo no hay arrastre todavía", () => {
    const result = calculateWeeklyAvailable(800, [], period, d(2026, 8, 5), 1);
    expect(result.carryover.toNumber()).toBe(0);
    expect(result.weeklyBudget.toNumber()).toBe(200);
    expect(result.daysLeftInWeek).toBe(5); // mié, jue, vie, sáb, dom
  });

  it("remaining descuenta lo ya gastado en la semana en curso", () => {
    const expenses = [expense(30, 2026, 8, 11)]; // gasto de esta semana (semana 2)
    const result = calculateWeeklyAvailable(800, expenses, period, d(2026, 8, 12), 1);
    expect(result.spent.toNumber()).toBe(30);
    expect(result.remaining.toNumber()).toBe(result.weeklyBudget.toNumber() - 30);
  });

  it("remaining puede ser negativo si ya te pasaste esta semana", () => {
    const expenses = [expense(500, 2026, 8, 11)];
    const result = calculateWeeklyAvailable(800, expenses, period, d(2026, 8, 12), 1);
    expect(result.remaining.toNumber()).toBeLessThan(0);
  });

  it("nunca divide entre menos de 1 semana", () => {
    const shortPeriod = { start: d(2026, 8, 15), end: d(2026, 8, 15) };
    const result = calculateWeeklyAvailable(50, [], shortPeriod, d(2026, 8, 15), 1);
    expect(result.baseWeeklyAmount.toNumber()).toBe(50);
  });

  it("una semana parcial al borde del ciclo cuenta como una semana entera para la base", () => {
    // Ciclo que arranca sábado 15 de agosto (la primera semana es corta: sáb-dom).
    const partialPeriod = { start: d(2026, 8, 15), end: d(2026, 9, 11) };
    const result = calculateWeeklyAvailable(400, [], partialPeriod, d(2026, 8, 15), 1);
    // 5 semanas: 15-16 ago (parcial), 17-23, 24-30, 31ago-6sep, 7-11sep (parcial)
    expect(result.baseWeeklyAmount.toNumber()).toBe(80);
  });

  it("un ingreso puntual queda disponible entero en la semana en que llegó, no repartido en todo el ciclo", () => {
    // Reproduce el bug reportado: recibís 200 y gastás 158 el mismo día.
    // El llamador ya sacó ese ingreso de totalDiscretionaryForCycle (acá
    // simulado con una base chica) para que no se cuente dos veces.
    const movements = [expense(158, 2026, 8, 12), income(200, 2026, 8, 12)];
    const result = calculateWeeklyAvailable(120, movements, period, d(2026, 8, 12), 1);
    // spent neto de la semana = 158 - 200 = -42 (quedó plata, no se gastó de más)
    expect(result.spent.toNumber()).toBe(-42);
    expect(result.remaining.toNumber()).toBeGreaterThan(0);
  });

  it("un ingreso puntual en una semana ya cerrada se traslada como sobrante extra", () => {
    const movements = [expense(50, 2026, 8, 5), income(200, 2026, 8, 6)]; // semana 1: gastó 50, cobró 200
    const result = calculateWeeklyAvailable(800, movements, period, d(2026, 8, 10), 1);
    // sobrante de la semana 1 = base(200) - (50 - 200) = 200 + 150 = 350
    expect(result.carryover.toNumber()).toBe(350);
  });
});
