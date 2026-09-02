import { describe, expect, it } from "vitest";
import { calculateAlerts } from "./calculateAlerts";

function d(year: number, month: number, day: number) {
  return new Date(year, month - 1, day);
}

const basePace = { onTrack: true, projectedOverage: 0 };

describe("calculateAlerts", () => {
  it("reproduce el ejemplo del spec: alquiler que se cobra en 3 días", () => {
    const alerts = calculateAlerts({
      today: d(2026, 8, 26),
      upcomingPayments: [{ name: "Alquiler", amount: 600, dueDate: d(2026, 8, 29) }],
      categoryComparisons: [],
      pace: basePace,
      availableToSpend: 500,
    });
    expect(alerts.some((a) => a.message.includes('"Alquiler"') && a.message.includes("en 3 días"))).toBe(true);
  });

  it("no alerta sobre pagos fuera de la ventana de 3 días", () => {
    const alerts = calculateAlerts({
      today: d(2026, 8, 26),
      upcomingPayments: [{ name: "Netflix", amount: 15, dueDate: d(2026, 9, 5) }],
      categoryComparisons: [],
      pace: basePace,
      availableToSpend: 500,
    });
    expect(alerts.some((a) => a.id.startsWith("upcoming-"))).toBe(false);
  });

  it("reproduce el ejemplo del spec: 35% más en restaurantes", () => {
    const alerts = calculateAlerts({
      today: d(2026, 8, 26),
      upcomingPayments: [],
      categoryComparisons: [
        { categoryId: "restaurants", name: "Restaurantes", current: 135, previous: 100 },
      ],
      pace: basePace,
      availableToSpend: 500,
    });
    expect(alerts.some((a) => a.message.includes("35% más en Restaurantes"))).toBe(true);
  });

  it("no alerta gasto elevado si el aumento es menor al 20%", () => {
    const alerts = calculateAlerts({
      today: d(2026, 8, 26),
      upcomingPayments: [],
      categoryComparisons: [
        { categoryId: "restaurants", name: "Restaurantes", current: 110, previous: 100 },
      ],
      pace: basePace,
      availableToSpend: 500,
    });
    expect(alerts.some((a) => a.id === "high-spend-restaurants")).toBe(false);
  });

  it("alerta de riesgo cuando el ritmo proyecta sobregasto", () => {
    const alerts = calculateAlerts({
      today: d(2026, 8, 26),
      upcomingPayments: [],
      categoryComparisons: [],
      pace: { onTrack: false, projectedOverage: 120 },
      availableToSpend: 500,
    });
    expect(alerts.some((a) => a.tone === "danger" && a.message.includes("120"))).toBe(true);
  });

  it("alerta de buen ritmo cuando todo va bien", () => {
    const alerts = calculateAlerts({
      today: d(2026, 8, 26),
      upcomingPayments: [],
      categoryComparisons: [],
      pace: basePace,
      availableToSpend: 500,
    });
    expect(alerts.some((a) => a.id === "pace-good" && a.tone === "success")).toBe(true);
  });

  it("alerta de riesgo cuando el disponible ya es negativo", () => {
    const alerts = calculateAlerts({
      today: d(2026, 8, 26),
      upcomingPayments: [],
      categoryComparisons: [],
      pace: basePace,
      availableToSpend: -50,
    });
    expect(alerts.some((a) => a.id === "risk-negative-available")).toBe(true);
  });
});
