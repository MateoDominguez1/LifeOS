import { describe, expect, it } from "vitest";
import { calculateAvailableToSpend } from "./calculateAvailableToSpend";

describe("calculateAvailableToSpend", () => {
  it("reproduce el ejemplo de la sección 2 del spec: 1500 - 600 - 150 = 750", () => {
    const available = calculateAvailableToSpend(1500, 600, [150]);
    expect(available.toNumber()).toBe(750);
  });

  it("reproduce el ejemplo completo de la sección 27 del spec", () => {
    // Total 1700, reservado gastos fijos 680 (600+15+30+35), supermercado 200 -> disponible 820
    const available = calculateAvailableToSpend(1700, 680, [200]);
    expect(available.toNumber()).toBe(820);
  });

  it("reproduce el ejemplo de la sección 8: 1000 - 300 - 150 = 550", () => {
    const available = calculateAvailableToSpend(1000, 300, [150]);
    expect(available.toNumber()).toBe(550);
  });

  it("un presupuesto sobregastado no devuelve dinero al disponible", () => {
    // presupuesto restante -50 (sobregastado) no debe sumar +50 al disponible
    const available = calculateAvailableToSpend(1000, 0, [-50]);
    expect(available.toNumber()).toBe(1000);
  });

  it("suma varios presupuestos restantes", () => {
    const available = calculateAvailableToSpend(1000, 100, [50, 30, 20]);
    expect(available.toNumber()).toBe(800);
  });

  it("al gastar 50 hoy, el disponible baja en la misma cantidad", () => {
    const before = calculateAvailableToSpend(1700, 680, [200]);
    const after = calculateAvailableToSpend(1650, 680, [200]);
    expect(before.minus(after).toNumber()).toBe(50);
    expect(after.toNumber()).toBe(770);
  });
});
