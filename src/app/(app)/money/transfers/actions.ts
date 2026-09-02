"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { transferSchema } from "@/lib/money/validation/accounts";

export type ActionState = { error?: string } | undefined;

export async function createTransferAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = transferSchema.safeParse({
    fromAccountId: formData.get("fromAccountId"),
    toAccountId: formData.get("toAccountId"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { fromAccountId, toAccountId, amount, date, note } = parsed.data;

  const [fromAccount, toAccount] = await Promise.all([
    prisma.account.findFirst({ where: { id: fromAccountId, userId } }),
    prisma.account.findFirst({ where: { id: toAccountId, userId } }),
  ]);
  if (!fromAccount || !toAccount) {
    return { error: "Cuenta inválida" };
  }

  await prisma.$transaction([
    prisma.account.update({
      where: { id: fromAccountId },
      data: { balance: { decrement: amount } },
    }),
    prisma.account.update({
      where: { id: toAccountId },
      data: { balance: { increment: amount } },
    }),
    prisma.transfer.create({
      data: { userId, fromAccountId, toAccountId, amount, date, note },
    }),
  ]);

  revalidatePath("/money/accounts");
  revalidatePath("/money/transactions");
  revalidatePath("/money");
  redirect("/money/accounts");
}

export async function deleteTransferAction(transferId: string) {
  const userId = await requireUserId();
  const transfer = await prisma.transfer.findFirst({ where: { id: transferId, userId } });
  if (!transfer) throw new Error("Transferencia no encontrada");

  await prisma.$transaction([
    prisma.account.update({
      where: { id: transfer.fromAccountId },
      data: { balance: { increment: transfer.amount } },
    }),
    prisma.account.update({
      where: { id: transfer.toAccountId },
      data: { balance: { decrement: transfer.amount } },
    }),
    prisma.transfer.delete({ where: { id: transferId } }),
  ]);

  revalidatePath("/money/transactions");
  revalidatePath("/money/accounts");
  revalidatePath("/money");
  revalidatePath("/money/calendar");
}
