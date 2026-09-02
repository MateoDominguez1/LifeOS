"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { accountSchema } from "@/lib/money/validation/accounts";

export type ActionState = { error?: string } | undefined;

function parseAccountForm(formData: FormData) {
  return accountSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    balance: formData.get("balance"),
    color: formData.get("color") || "#6366f1",
    icon: formData.get("icon") || "wallet",
    excludeFromTotal: formData.get("excludeFromTotal") ? true : false,
  });
}

export async function createAccountAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = parseAccountForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await prisma.account.create({ data: { ...parsed.data, userId } });

  revalidatePath("/money/accounts");
  revalidatePath("/money");
  redirect("/money/accounts");
}

export async function updateAccountAction(
  accountId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = parseAccountForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) return { error: "Cuenta no encontrada" };

  await prisma.account.update({ where: { id: accountId }, data: parsed.data });

  revalidatePath("/money/accounts");
  revalidatePath("/money");
  redirect("/money/accounts");
}

export async function toggleAccountActiveAction(accountId: string) {
  const userId = await requireUserId();
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) throw new Error("Cuenta no encontrada");

  await prisma.account.update({
    where: { id: accountId },
    data: { isActive: !account.isActive },
  });

  revalidatePath("/money/accounts");
}

export async function deleteAccountAction(accountId: string) {
  const userId = await requireUserId();
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) throw new Error("Cuenta no encontrada");

  const [txCount, transferCount, fixedCount, incomeCount] = await Promise.all([
    prisma.transaction.count({ where: { accountId } }),
    prisma.transfer.count({
      where: { OR: [{ fromAccountId: accountId }, { toAccountId: accountId }] },
    }),
    prisma.fixedExpense.count({ where: { accountId } }),
    prisma.income.count({ where: { accountId } }),
  ]);

  if (txCount + transferCount + fixedCount + incomeCount > 0) {
    throw new Error(
      "No se puede eliminar: la cuenta tiene movimientos asociados. Desactivala en su lugar."
    );
  }

  await prisma.account.delete({ where: { id: accountId } });
  revalidatePath("/money/accounts");
}
