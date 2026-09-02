"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { incomeSchema } from "@/lib/money/validation/income";

export type ActionState = { error?: string } | undefined;

function parseIncomeForm(formData: FormData) {
  return incomeSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount") || undefined,
    accountId: formData.get("accountId"),
    dayOfMonth: formData.get("dayOfMonth"),
    frequency: formData.get("frequency"),
    isActive: formData.get("isActive") ? true : false,
  });
}

export async function createIncomeAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = parseIncomeForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const account = await prisma.account.findFirst({
    where: { id: parsed.data.accountId, userId },
  });
  if (!account) return { error: "Cuenta inválida" };

  await prisma.income.create({
    data: { ...parsed.data, amount: parsed.data.amount || null, userId },
  });

  revalidatePath("/money/income");
  revalidatePath("/money");
  redirect("/money/income");
}

export async function updateIncomeAction(
  incomeId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = parseIncomeForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const income = await prisma.income.findFirst({ where: { id: incomeId, userId } });
  if (!income) return { error: "Ingreso no encontrado" };

  const account = await prisma.account.findFirst({
    where: { id: parsed.data.accountId, userId },
  });
  if (!account) return { error: "Cuenta inválida" };

  await prisma.income.update({
    where: { id: incomeId },
    data: { ...parsed.data, amount: parsed.data.amount || null },
  });

  revalidatePath("/money/income");
  revalidatePath("/money");
  redirect("/money/income");
}

export async function toggleIncomeActiveAction(incomeId: string) {
  const userId = await requireUserId();
  const income = await prisma.income.findFirst({ where: { id: incomeId, userId } });
  if (!income) throw new Error("Ingreso no encontrado");

  await prisma.income.update({
    where: { id: incomeId },
    data: { isActive: !income.isActive },
  });

  revalidatePath("/money/income");
  revalidatePath("/money");
}

export async function deleteIncomeAction(incomeId: string) {
  const userId = await requireUserId();
  const income = await prisma.income.findFirst({ where: { id: incomeId, userId } });
  if (!income) throw new Error("Ingreso no encontrado");

  const linkedTransactions = await prisma.transaction.count({ where: { incomeId } });
  if (linkedTransactions > 0) {
    throw new Error("No se puede eliminar: tiene cobros registrados. Desactivalo en su lugar.");
  }

  await prisma.income.delete({ where: { id: incomeId } });
  revalidatePath("/money/income");
  revalidatePath("/money");
}
