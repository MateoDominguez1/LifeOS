"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { categorySchema } from "@/lib/money/validation/categories";
import { createApiTokenSchema } from "@/lib/money/validation/apiTokens";
import { generateApiToken, hashApiToken } from "@/lib/money/apiTokens/token";

export type ActionState = { error?: string } | undefined;

export async function createCategoryAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    icon: formData.get("icon") || "🏷️",
    color: formData.get("color") || "#94a3b8",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await prisma.category.create({ data: { ...parsed.data, userId, isDefault: false } });

  revalidatePath("/money/settings");
}

export async function deleteCategoryAction(categoryId: string) {
  const userId = await requireUserId();
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) throw new Error("Categoría no encontrada");

  await prisma.category.delete({ where: { id: categoryId } });
  revalidatePath("/money/settings");
}

export type CreateApiTokenState =
  | { error: string; createdToken?: undefined }
  | { error?: undefined; createdToken: { name: string; token: string } }
  | undefined;

export async function createApiTokenAction(
  _prevState: CreateApiTokenState,
  formData: FormData
): Promise<CreateApiTokenState> {
  const userId = await requireUserId();

  const parsed = createApiTokenSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const token = generateApiToken();
  await prisma.apiToken.create({
    data: { userId, name: parsed.data.name, tokenHash: hashApiToken(token) },
  });

  revalidatePath("/money/settings");
  return { createdToken: { name: parsed.data.name, token } };
}

export async function deleteApiTokenAction(tokenId: string) {
  const userId = await requireUserId();
  const token = await prisma.apiToken.findFirst({ where: { id: tokenId, userId } });
  if (!token) throw new Error("Token no encontrado");

  await prisma.apiToken.delete({ where: { id: tokenId } });
  revalidatePath("/money/settings");
}

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function savePushSubscriptionAction(subscription: PushSubscriptionInput) {
  const userId = await requireUserId();

  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    update: {
      userId,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
}

export async function deletePushSubscriptionAction(endpoint: string) {
  const userId = await requireUserId();
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
}
