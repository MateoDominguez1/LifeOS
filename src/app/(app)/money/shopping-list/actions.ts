"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { completeShoppingListSchema } from "@/lib/money/validation/shoppingList";
import { parseShoppingListText } from "@/lib/money/shoppingList/parseShoppingListText";

export type ActionState = { error?: string; success?: boolean } | undefined;

async function getOrCreateOpenShoppingList(userId: string) {
  const existing = await prisma.shoppingList.findFirst({
    where: { userId, completedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;

  return prisma.shoppingList.create({ data: { userId } });
}

export async function addItemsFromTextAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const text = String(formData.get("text") ?? "");
  const items = parseShoppingListText(text);
  if (items.length === 0) {
    return { error: "No pude reconocer ningún producto. Revisá el formato (Producto - precio)." };
  }

  const list = await getOrCreateOpenShoppingList(userId);
  await prisma.shoppingListItem.createMany({
    data: items.map((item) => ({
      shoppingListId: list.id,
      description: item.description,
      estimatedPrice: item.price,
    })),
  });

  revalidatePath("/money/shopping-list");
  return { success: true };
}

export async function deleteShoppingListItemAction(itemId: string) {
  const userId = await requireUserId();

  const item = await prisma.shoppingListItem.findFirst({
    where: { id: itemId, shoppingList: { userId } },
  });
  if (!item) throw new Error("Producto no encontrado");

  await prisma.shoppingListItem.delete({ where: { id: itemId } });
  revalidatePath("/money/shopping-list");
}

export async function discardShoppingListAction(shoppingListId: string) {
  const userId = await requireUserId();

  const list = await prisma.shoppingList.findFirst({ where: { id: shoppingListId, userId } });
  if (!list) throw new Error("Lista no encontrada");

  await prisma.shoppingList.delete({ where: { id: shoppingListId } });
  revalidatePath("/money/shopping-list");
}

export async function completeShoppingListAction(
  shoppingListId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const list = await prisma.shoppingList.findFirst({ where: { id: shoppingListId, userId } });
  if (!list) return { error: "Lista no encontrada" };

  const parsed = completeShoppingListSchema.safeParse({
    amount: formData.get("amount"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId") || undefined,
    accountId: formData.get("accountId"),
    date: formData.get("date"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { amount, description, categoryId, accountId, date } = parsed.data;

  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) return { error: "Cuenta inválida" };

  await prisma.$transaction([
    prisma.account.update({
      where: { id: accountId },
      data: { balance: { decrement: amount } },
    }),
    prisma.transaction.create({
      data: { userId, accountId, categoryId: categoryId || null, type: "EXPENSE", amount, description, date },
    }),
    prisma.shoppingList.update({
      where: { id: shoppingListId },
      data: { completedAt: new Date() },
    }),
  ]);

  revalidatePath("/money/shopping-list");
  revalidatePath("/money/accounts");
  revalidatePath("/money/budgets");
  revalidatePath("/money/transactions");
  revalidatePath("/money");
  redirect("/money/accounts");
}
