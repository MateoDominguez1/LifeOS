import { prisma } from "@/lib/db/prisma";

export type CreateTransactionInput = {
  userId: string;
  type: "EXPENSE" | "INCOME";
  amount: number;
  description: string;
  categoryId?: string | null;
  accountId: string;
  date: Date;
  note?: string | null;
  receipt?: { data: Uint8Array<ArrayBuffer>; mimeType: string; fileName: string } | null;
};

export type CreateTransactionResult =
  | { ok: true; transactionId: string; newBalance: number }
  | { ok: false; error: string };

/**
 * Lógica compartida para crear un movimiento y actualizar el saldo de la
 * cuenta — así el cálculo de saldo vive en un solo lugar.
 */
export async function createTransactionCore(
  input: CreateTransactionInput
): Promise<CreateTransactionResult> {
  const account = await prisma.account.findFirst({
    where: { id: input.accountId, userId: input.userId },
  });
  if (!account) return { ok: false, error: "Cuenta inválida" };

  const balanceChange = input.type === "INCOME" ? input.amount : -input.amount;

  const [updatedAccount, transaction] = await prisma.$transaction([
    prisma.account.update({
      where: { id: input.accountId },
      data: { balance: { increment: balanceChange } },
    }),
    prisma.transaction.create({
      data: {
        userId: input.userId,
        accountId: input.accountId,
        categoryId: input.categoryId || null,
        type: input.type,
        amount: input.amount,
        description: input.description,
        note: input.note || null,
        date: input.date,
        receiptData: input.receipt?.data,
        receiptMimeType: input.receipt?.mimeType,
        receiptFileName: input.receipt?.fileName,
      },
    }),
  ]);

  return { ok: true, transactionId: transaction.id, newBalance: updatedAccount.balance.toNumber() };
}
