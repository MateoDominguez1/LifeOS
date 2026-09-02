"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";

export async function logWater(amountMl: number) {
  const userId = await requireUserId();
  if (!Number.isFinite(amountMl) || amountMl <= 0 || amountMl > 5000) {
    throw new Error("Cantidad de agua inválida.");
  }

  await prisma.waterEntry.create({
    data: { userId, amountMl },
  });

  revalidatePath("/nutrition");
}
