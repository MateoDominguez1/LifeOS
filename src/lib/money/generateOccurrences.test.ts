import { describe, expect, it } from "vitest";
import { generateOccurrences } from "./generateOccurrences";

function d(year: number, month: number, day: number) {
  return new Date(year, month - 1, day);
}

describe("generateOccurrences", () => {
  it("MONTHLY: genera una ocurrencia por mes dentro del rango (ejemplo del spec)", () => {
    const period = { start: d(2026, 8, 15), end: d(2026, 9, 14) };

    const rent = generateOccurrences(
      { referenceDay: 1, frequency: "MONTHLY", startDate: d(2020, 1, 1) },
      period.start,
      period.end,
    );
    expect(rent).toEqual([d(2026, 9, 1)]);

    const netflix = generateOccurrences(
      { referenceDay: 20, frequency: "MONTHLY", startDate: d(2020, 1, 1) },
      period.start,
      period.end,
    );
    expect(netflix).toEqual([d(2026, 8, 20)]);

    const phone = generateOccurrences(
      { referenceDay: 25, frequency: "MONTHLY", startDate: d(2020, 1, 1) },
      period.start,
      period.end,
    );
    expect(phone).toEqual([d(2026, 8, 25)]);
  });

  it("MONTHLY: clampea el día 31 en meses cortos", () => {
    const result = generateOccurrences(
      { referenceDay: 31, frequency: "MONTHLY", startDate: d(2020, 1, 1) },
      d(2026, 4, 1),
      d(2026, 4, 30),
    );
    expect(result).toEqual([d(2026, 4, 30)]);
  });

  it("respeta startDate: no genera ocurrencias antes del inicio", () => {
    const result = generateOccurrences(
      { referenceDay: 10, frequency: "MONTHLY", startDate: d(2026, 9, 1) },
      d(2026, 8, 1),
      d(2026, 9, 30),
    );
    expect(result).toEqual([d(2026, 9, 10)]);
  });

  it("respeta endDate: no genera ocurrencias después del final", () => {
    const result = generateOccurrences(
      { referenceDay: 10, frequency: "MONTHLY", startDate: d(2020, 1, 1), endDate: d(2026, 8, 15) },
      d(2026, 8, 1),
      d(2026, 9, 30),
    );
    expect(result).toEqual([d(2026, 8, 10)]);
  });

  it("WEEKLY: genera una ocurrencia por semana en el día indicado", () => {
    // 2026-08-01 es sábado (día 6)
    const result = generateOccurrences(
      { referenceDay: 6, frequency: "WEEKLY", startDate: d(2020, 1, 1) },
      d(2026, 8, 1),
      d(2026, 8, 22),
    );
    expect(result).toEqual([d(2026, 8, 1), d(2026, 8, 8), d(2026, 8, 15), d(2026, 8, 22)]);
  });

  it("YEARLY: una ocurrencia por año en el mes de startDate", () => {
    const result = generateOccurrences(
      { referenceDay: 24, frequency: "YEARLY", startDate: d(2020, 12, 24) },
      d(2026, 1, 1),
      d(2027, 12, 31),
    );
    expect(result).toEqual([d(2026, 12, 24), d(2027, 12, 24)]);
  });

  it("devuelve vacío cuando el rango es inválido", () => {
    const result = generateOccurrences(
      { referenceDay: 1, frequency: "MONTHLY", startDate: d(2020, 1, 1) },
      d(2026, 9, 1),
      d(2026, 8, 1),
    );
    expect(result).toEqual([]);
  });
});
