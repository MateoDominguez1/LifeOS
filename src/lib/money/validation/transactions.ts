import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["EXPENSE", "INCOME"]),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  description: z.string().min(1, "La descripción es obligatoria").max(120),
  categoryId: z.string().min(1).optional().or(z.literal("")),
  accountId: z.string().min(1, "Elegí una cuenta"),
  date: z.coerce.date(),
  note: z.string().max(200).optional(),
});
