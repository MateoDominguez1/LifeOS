import { z } from "zod";

export const ACCOUNT_TYPES = ["CHECKING", "SAVINGS", "CASH", "CARD", "OTHER"] as const;

export const accountSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(60),
  type: z.enum(ACCOUNT_TYPES),
  balance: z.coerce.number().finite("El saldo debe ser un número válido"),
  color: z.string().min(1),
  icon: z.string().min(1),
  excludeFromTotal: z.coerce.boolean().default(false),
});

export const transferSchema = z
  .object({
    fromAccountId: z.string().min(1, "Elegí la cuenta de origen"),
    toAccountId: z.string().min(1, "Elegí la cuenta de destino"),
    amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
    date: z.coerce.date(),
    note: z.string().max(200).optional(),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: "La cuenta de origen y destino deben ser distintas",
    path: ["toAccountId"],
  });
