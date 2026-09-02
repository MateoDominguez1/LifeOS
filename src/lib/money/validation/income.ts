import { z } from "zod";

export const FREQUENCIES = ["WEEKLY", "MONTHLY", "YEARLY"] as const;

export const incomeSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(60),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0").optional().or(z.literal("")),
  accountId: z.string().min(1, "Elegí una cuenta"),
  dayOfMonth: z.coerce.number().int().min(1).max(31),
  frequency: z.enum(FREQUENCIES),
  isActive: z.coerce.boolean().default(true),
});
