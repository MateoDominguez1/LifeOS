"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import type { MeasurementType } from "@/generated/prisma/client";

async function assertOwnsProfile(userId: string, managedProfileId: string) {
  const profile = await prisma.managedProfile.findUnique({ where: { id: managedProfileId } });
  if (!profile || profile.ownerId !== userId) throw new Error("No autorizado");
  return profile;
}

export async function logManagedWeight(managedProfileId: string, weightKg: number) {
  const userId = await requireUserId();
  await assertOwnsProfile(userId, managedProfileId);

  if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 400) {
    throw new Error("Peso inválido.");
  }

  await prisma.weightEntry.create({ data: { userId, managedProfileId, weightKg } });
  revalidatePath(`/fitness/people/${managedProfileId}`);
}

export async function logManagedMeasurement(
  managedProfileId: string,
  input: { type: MeasurementType; customLabel?: string; valueCm: number }
) {
  const userId = await requireUserId();
  await assertOwnsProfile(userId, managedProfileId);

  if (!Number.isFinite(input.valueCm) || input.valueCm < 1 || input.valueCm > 300) {
    throw new Error("Medida inválida.");
  }

  await prisma.bodyMeasurement.create({
    data: { userId, managedProfileId, type: input.type, customLabel: input.customLabel?.trim() || null, valueCm: input.valueCm },
  });
  revalidatePath(`/fitness/people/${managedProfileId}`);
}
