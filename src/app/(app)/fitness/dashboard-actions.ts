"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";

export async function resolveRecommendation(recommendationId: string, status: "ACCEPTED" | "DISMISSED") {
  const userId = await requireUserId();

  const recommendation = await prisma.aIRecommendation.findUnique({ where: { id: recommendationId } });
  if (!recommendation || recommendation.userId !== userId) throw new Error("No autorizado");

  await prisma.aIRecommendation.update({
    where: { id: recommendationId },
    data: { status, resolvedAt: new Date() },
  });

  revalidatePath("/fitness");
}
