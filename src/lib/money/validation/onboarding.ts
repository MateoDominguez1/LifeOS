import { z } from "zod";

export const onboardingSalarySchema = z.object({
  accountName: z.string().min(1, "El nombre es obligatorio").max(60),
  salaryName: z.string().min(1, "El nombre es obligatorio").max(60),
  salaryAmount: z.coerce.number().positive("El monto debe ser mayor a 0").optional().or(z.literal("")),
  salaryDay: z.coerce.number().int().min(1).max(31),
});

export const onboardingFixedExpenseSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(60),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  dueDay: z.coerce.number().int().min(1).max(31),
  accountId: z.string().min(1, "Elegí una cuenta"),
});

export const onboardingGroceryBudgetSchema = z.object({
  monthlyAmount: z.coerce.number().positive("El monto debe ser mayor a 0"),
});
