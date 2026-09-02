import { z } from "zod";

export const FREQUENCIES = ["WEEKLY", "MONTHLY", "YEARLY"] as const;

export const fixedExpenseSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(60),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  dueDay: z.coerce.number().int().min(0).max(31),
  accountId: z.string().min(1, "Elegí una cuenta"),
  categoryId: z.string().min(1).optional().or(z.literal("")),
  frequency: z.enum(FREQUENCIES),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().or(z.literal("")),
  isActive: z.coerce.boolean().default(true),
});
