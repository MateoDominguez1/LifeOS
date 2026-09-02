import { Decimal, toDecimal } from "./decimal";
import type { AccountLike } from "./types";

/**
 * Suma el saldo de todas las cuentas activas.
 * Las cuentas inactivas se excluyen: representan cuentas cerradas/archivadas
 * cuyo saldo ya no forma parte del dinero disponible del usuario. Las cuentas
 * marcadas `excludeFromTotal` también se excluyen: es plata que no es del
 * usuario (ej. se la pasa un familiar para un fin específico), así que no
 * debe sumar ni al saldo total ni, por lo tanto, al disponible.
 */
export function calculateTotalBalance(accounts: AccountLike[]): Decimal {
  return accounts
    .filter((account) => account.isActive && !account.excludeFromTotal)
    .reduce((sum, account) => sum.plus(toDecimal(account.balance)), new Decimal(0));
}
