import Decimal from "decimal.js";

export { Decimal };

export type DecimalInput = Decimal | number | string;

export function toDecimal(value: DecimalInput): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
}
