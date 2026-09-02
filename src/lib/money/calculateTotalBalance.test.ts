import { describe, expect, it } from "vitest";
import { calculateTotalBalance } from "./calculateTotalBalance";

describe("calculateTotalBalance", () => {
  it("suma los saldos de las cuentas del ejemplo del spec", () => {
    const total = calculateTotalBalance([
      { id: "1", balance: 900, isActive: true },
      { id: "2", balance: 350, isActive: true },
      { id: "3", balance: 150, isActive: true },
      { id: "4", balance: 50, isActive: true },
    ]);
    expect(total.toNumber()).toBe(1450);
  });

  it("excluye cuentas inactivas del total", () => {
    const total = calculateTotalBalance([
      { id: "1", balance: 1000, isActive: true },
      { id: "2", balance: 500, isActive: false },
    ]);
    expect(total.toNumber()).toBe(1000);
  });

  it("devuelve 0 cuando no hay cuentas", () => {
    expect(calculateTotalBalance([]).toNumber()).toBe(0);
  });

  it("no acumula errores de coma flotante con montos con centavos", () => {
    const total = calculateTotalBalance([
      { id: "1", balance: "900.55", isActive: true },
      { id: "2", balance: "0.45", isActive: true },
    ]);
    expect(total.toNumber()).toBe(901);
  });

  it("soporta saldos negativos (cuenta en descubierto)", () => {
    const total = calculateTotalBalance([
      { id: "1", balance: 100, isActive: true },
      { id: "2", balance: -30, isActive: true },
    ]);
    expect(total.toNumber()).toBe(70);
  });

  it("excluye cuentas marcadas excludeFromTotal (plata que no es del usuario)", () => {
    const total = calculateTotalBalance([
      { id: "1", balance: 1000, isActive: true },
      { id: "2", balance: 200, isActive: true, excludeFromTotal: true },
    ]);
    expect(total.toNumber()).toBe(1000);
  });
});
