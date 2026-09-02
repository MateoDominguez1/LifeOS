"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import {
  onboardingSalarySchema,
  onboardingFixedExpenseSchema,
  onboardingGroceryBudgetSchema,
} from "@/lib/money/validation/onboarding";

export type ActionState = { error?: string } | undefined;

export async function completeSalaryStepAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = onboardingSalarySchema.safeParse({
    accountName: formData.get("accountName"),
    salaryName: formData.get("salaryName"),
    salaryAmount: formData.get("salaryAmount") || undefined,
    salaryDay: formData.get("salaryDay"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const account = await prisma.account.create({
    data: { userId, name: parsed.data.accountName, type: "CHECKING", balance: 0 },
  });

  await prisma.income.create({
    data: {
      userId,
      name: parsed.data.salaryName,
      amount: parsed.data.salaryAmount || null,
      accountId: account.id,
      dayOfMonth: parsed.data.salaryDay,
      frequency: "MONTHLY",
      isActive: true,
    },
  });

  redirect("/money/onboarding/fixed-expenses");
}

export async function addOnboardingFixedExpenseAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = onboardingFixedExpenseSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    dueDay: formData.get("dueDay"),
    accountId: formData.get("accountId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const account = await prisma.account.findFirst({ where: { id: parsed.data.accountId, userId } });
  if (!account) return { error: "Cuenta inválida" };

  await prisma.fixedExpense.create({
    data: {
      userId,
      name: parsed.data.name,
      amount: parsed.data.amount,
      dueDay: parsed.data.dueDay,
      accountId: parsed.data.accountId,
      frequency: "MONTHLY",
      startDate: new Date(),
      isActive: true,
    },
  });

  return {};
}

export async function completeGroceryBudgetAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = onboardingGroceryBudgetSchema.safeParse({
    monthlyAmount: formData.get("monthlyAmount"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const groceryCategory = await prisma.category.findFirst({ where: { name: "Supermercado", userId: null } });
  if (!groceryCategory) return { error: "No se encontró la categoría Supermercado" };

  await prisma.budget.create({
    data: {
      userId,
      name: "Supermercado",
      type: "GROCERY",
      categoryId: groceryCategory.id,
      monthlyAmount: parsed.data.monthlyAmount,
      isActive: true,
    },
  });

  redirect("/money");
}

export async function skipOnboardingAction() {
  redirect("/money");
}
