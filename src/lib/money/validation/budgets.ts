import { z } from "zod";

export const BUDGET_TYPES = ["GROCERY", "CUSTOM"] as const;

export const budgetSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(60),
  type: z.enum(BUDGET_TYPES),
  categoryId: z.string().min(1, "Elegí una categoría"),
  accountId: z.string().min(1).optional().or(z.literal("")),
  monthlyAmount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  weeklyAmount: z.coerce.number().positive().optional().or(z.literal("")),
  weekStartDay: z.coerce.number().int().min(0).max(6).optional().or(z.literal("")),
  isActive: z.coerce.boolean().default(true),
});
