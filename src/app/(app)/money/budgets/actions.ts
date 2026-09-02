"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { budgetSchema } from "@/lib/money/validation/budgets";

export type ActionState = { error?: string } | undefined;

function parseBudgetForm(formData: FormData) {
  return budgetSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    categoryId: formData.get("categoryId"),
    accountId: formData.get("accountId") || undefined,
    monthlyAmount: formData.get("monthlyAmount"),
    weeklyAmount: formData.get("weeklyAmount") || undefined,
    weekStartDay: formData.get("weekStartDay") || undefined,
    isActive: formData.get("isActive") ? true : false,
  });
}

function normalizeWeekStartDay(weekStartDay: number | "" | undefined): number | null {
  return weekStartDay === "" || weekStartDay === undefined ? null : weekStartDay;
}

export async function createBudgetAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = parseBudgetForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await prisma.budget.create({
    data: {
      ...parsed.data,
      accountId: parsed.data.accountId || null,
      weeklyAmount: parsed.data.weeklyAmount || null,
      weekStartDay: normalizeWeekStartDay(parsed.data.weekStartDay),
      userId,
    },
  });

  revalidatePath("/money/budgets");
  revalidatePath("/money");
  redirect("/money/budgets");
}

export async function updateBudgetAction(
  budgetId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = parseBudgetForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const budget = await prisma.budget.findFirst({ where: { id: budgetId, userId } });
  if (!budget) return { error: "Presupuesto no encontrado" };

  await prisma.budget.update({
    where: { id: budgetId },
    data: {
      ...parsed.data,
      accountId: parsed.data.accountId || null,
      weeklyAmount: parsed.data.weeklyAmount || null,
      weekStartDay: normalizeWeekStartDay(parsed.data.weekStartDay),
    },
  });

  revalidatePath("/money/budgets");
  revalidatePath("/money");
  redirect("/money/budgets");
}

export async function toggleBudgetActiveAction(budgetId: string) {
  const userId = await requireUserId();
  const budget = await prisma.budget.findFirst({ where: { id: budgetId, userId } });
  if (!budget) throw new Error("Presupuesto no encontrado");

  await prisma.budget.update({
    where: { id: budgetId },
    data: { isActive: !budget.isActive },
  });

  revalidatePath("/money/budgets");
  revalidatePath("/money");
}

export async function deleteBudgetAction(budgetId: string) {
  const userId = await requireUserId();
  const budget = await prisma.budget.findFirst({ where: { id: budgetId, userId } });
  if (!budget) throw new Error("Presupuesto no encontrado");

  await prisma.budget.delete({ where: { id: budgetId } });
  revalidatePath("/money/budgets");
  revalidatePath("/money");
}
