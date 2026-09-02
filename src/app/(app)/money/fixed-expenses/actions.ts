"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { fixedExpenseSchema } from "@/lib/money/validation/fixedExpenses";

export type ActionState = { error?: string } | undefined;

function parseFixedExpenseForm(formData: FormData) {
  return fixedExpenseSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    dueDay: formData.get("dueDay"),
    accountId: formData.get("accountId"),
    categoryId: formData.get("categoryId") || undefined,
    frequency: formData.get("frequency"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
    isActive: formData.get("isActive") ? true : false,
  });
}

export async function createFixedExpenseAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = parseFixedExpenseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const account = await prisma.account.findFirst({
    where: { id: parsed.data.accountId, userId },
  });
  if (!account) return { error: "Cuenta inválida" };

  await prisma.fixedExpense.create({
    data: {
      ...parsed.data,
      categoryId: parsed.data.categoryId || null,
      endDate: parsed.data.endDate || null,
      userId,
    },
  });

  revalidatePath("/money/fixed-expenses");
  revalidatePath("/money");
  redirect("/money/fixed-expenses");
}

export async function updateFixedExpenseAction(
  fixedExpenseId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = parseFixedExpenseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const expense = await prisma.fixedExpense.findFirst({ where: { id: fixedExpenseId, userId } });
  if (!expense) return { error: "Gasto fijo no encontrado" };

  const account = await prisma.account.findFirst({
    where: { id: parsed.data.accountId, userId },
  });
  if (!account) return { error: "Cuenta inválida" };

  await prisma.fixedExpense.update({
    where: { id: fixedExpenseId },
    data: {
      ...parsed.data,
      categoryId: parsed.data.categoryId || null,
      endDate: parsed.data.endDate || null,
    },
  });

  revalidatePath("/money/fixed-expenses");
  revalidatePath("/money");
  redirect("/money/fixed-expenses");
}

export async function toggleFixedExpenseActiveAction(fixedExpenseId: string) {
  const userId = await requireUserId();
  const expense = await prisma.fixedExpense.findFirst({ where: { id: fixedExpenseId, userId } });
  if (!expense) throw new Error("Gasto fijo no encontrado");

  await prisma.fixedExpense.update({
    where: { id: fixedExpenseId },
    data: { isActive: !expense.isActive },
  });

  revalidatePath("/money/fixed-expenses");
  revalidatePath("/money");
}

export async function deleteFixedExpenseAction(fixedExpenseId: string) {
  const userId = await requireUserId();
  const expense = await prisma.fixedExpense.findFirst({ where: { id: fixedExpenseId, userId } });
  if (!expense) throw new Error("Gasto fijo no encontrado");

  const linkedTransactions = await prisma.transaction.count({ where: { fixedExpenseId } });
  if (linkedTransactions > 0) {
    throw new Error("No se puede eliminar: tiene pagos registrados. Desactivalo en su lugar.");
  }

  await prisma.fixedExpense.delete({ where: { id: fixedExpenseId } });
  revalidatePath("/money/fixed-expenses");
  revalidatePath("/money");
}

export async function markFixedExpensePaidAction(fixedExpenseId: string, occurrenceDateISO: string) {
  const userId = await requireUserId();
  const expense = await prisma.fixedExpense.findFirst({ where: { id: fixedExpenseId, userId } });
  if (!expense) throw new Error("Gasto fijo no encontrado");

  await prisma.$transaction([
    prisma.account.update({
      where: { id: expense.accountId },
      data: { balance: { decrement: expense.amount } },
    }),
    prisma.transaction.create({
      data: {
        userId,
        accountId: expense.accountId,
        categoryId: expense.categoryId,
        fixedExpenseId: expense.id,
        type: "EXPENSE",
        amount: expense.amount,
        description: expense.name,
        date: new Date(occurrenceDateISO),
      },
    }),
  ]);

  revalidatePath("/money/fixed-expenses");
  revalidatePath("/money");
}
