"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";

export async function logWeight(weightKg: number) {
  const userId = await requireUserId();

  if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 400) {
    throw new Error("Peso inválido.");
  }

  await prisma.weightEntry.create({
    data: { userId, weightKg },
  });

  revalidatePath("/nutrition/progress");
  revalidatePath("/nutrition");
}
