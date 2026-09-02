"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { transactionSchema } from "@/lib/money/validation/transactions";
import { createTransactionCore } from "@/lib/money/core/createTransactionCore";
import { parseReceiptFile } from "@/lib/money/receipts/parseReceiptFile";

export type ActionState = { error?: string } | undefined;

export async function createTransactionAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = transactionSchema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId") || undefined,
    accountId: formData.get("accountId"),
    date: formData.get("date"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { type, amount, description, categoryId, accountId, date, note } = parsed.data;

  let receipt;
  try {
    receipt = await parseReceiptFile(formData);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo procesar la imagen" };
  }

  const result = await createTransactionCore({
    userId,
    type,
    amount,
    description,
    categoryId,
    accountId,
    date,
    note,
    receipt,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/money/transactions");
  revalidatePath("/money/accounts");
  revalidatePath("/money");
  redirect("/money/transactions");
}

export async function updateTransactionAction(
  transactionId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const existing = await prisma.transaction.findFirst({ where: { id: transactionId, userId } });
  if (!existing) return { error: "Movimiento no encontrado" };

  const parsed = transactionSchema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId") || undefined,
    accountId: formData.get("accountId"),
    date: formData.get("date"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { type, amount, description, categoryId, accountId, date, note } = parsed.data;

  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) return { error: "Cuenta inválida" };

  let receipt;
  try {
    receipt = await parseReceiptFile(formData);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo procesar la imagen" };
  }
  const removeReceipt = formData.get("removeReceipt") === "on";

  // Revierte el efecto de saldo que había hecho la versión anterior del
  // movimiento (en su cuenta original) y aplica el nuevo (en la cuenta
  // elegida ahora).
  const oldReversal = existing.type === "EXPENSE" ? existing.amount : existing.amount.negated();
  const newChange = type === "INCOME" ? amount : -amount;

  await prisma.$transaction([
    prisma.account.update({
      where: { id: existing.accountId },
      data: { balance: { increment: oldReversal } },
    }),
    prisma.account.update({
      where: { id: accountId },
      data: { balance: { increment: newChange } },
    }),
    prisma.transaction.update({
      where: { id: transactionId },
      data: {
        accountId,
        categoryId: categoryId || null,
        type,
        amount,
        description,
        note,
        date,
        ...(receipt
          ? { receiptData: receipt.data, receiptMimeType: receipt.mimeType, receiptFileName: receipt.fileName }
          : removeReceipt
            ? { receiptData: null, receiptMimeType: null, receiptFileName: null }
            : {}),
      },
    }),
  ]);

  revalidatePath("/money/transactions");
  revalidatePath("/money/accounts");
  revalidatePath("/money");
  redirect("/money/transactions");
}

export async function deleteTransactionAction(transactionId: string) {
  const userId = await requireUserId();
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
  });
  if (!transaction) throw new Error("Movimiento no encontrado");

  // Revierte exactamente el cambio de saldo que hizo la creación: un gasto
  // había restado el monto, así que ahora se lo devolvemos (y viceversa).
  const reversal = transaction.type === "EXPENSE" ? transaction.amount : transaction.amount.negated();

  await prisma.$transaction([
    prisma.account.update({
      where: { id: transaction.accountId },
      data: { balance: { increment: reversal } },
    }),
    prisma.transaction.delete({ where: { id: transactionId } }),
  ]);

  revalidatePath("/money/transactions");
  revalidatePath("/money/accounts");
  revalidatePath("/money");
}
