import { describe, expect, it } from "vitest";
import { calculateSpendingPace } from "./calculateSpendingPace";

describe("calculateSpendingPace", () => {
  it("reproduce el ejemplo del spec: gastando 35/día, te pasarías por 100", () => {
    // 10 días transcurridos a 35/día = 350 gastados; quedan 10 días y 250 disponibles
    // proyectado: 35*10=350 > 250 disponibles -> sobregasto de 100
    const pace = calculateSpendingPace(350, 10, 250, 10);
    expect(pace.averageDailySpend.toNumber()).toBe(35);
    expect(pace.projectedOverage.toNumber()).toBe(100);
    expect(pace.onTrack).toBe(false);
  });

  it("va bien cuando el ritmo proyectado no supera el disponible", () => {
    const pace = calculateSpendingPace(200, 10, 250, 10);
    expect(pace.averageDailySpend.toNumber()).toBe(20);
    expect(pace.projectedOverage.toNumber()).toBe(0);
    expect(pace.onTrack).toBe(true);
  });

  it("sin días transcurridos, el ritmo promedio es 0", () => {
    const pace = calculateSpendingPace(0, 0, 500, 10);
    expect(pace.averageDailySpend.toNumber()).toBe(0);
    expect(pace.onTrack).toBe(true);
  });

  it("el límite diario coincide con calculateDailySpendingLimit", () => {
    const pace = calculateSpendingPace(100, 5, 820, 20);
    expect(pace.dailyLimit.toNumber()).toBe(41);
  });
});
