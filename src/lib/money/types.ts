import type { DecimalInput } from "./decimal";

export interface AccountLike {
  id: string;
  balance: DecimalInput;
  isActive: boolean;
  /** Plata que no es del usuario (ej: se la pasa un familiar para un fin específico). */
  excludeFromTotal?: boolean;
}
