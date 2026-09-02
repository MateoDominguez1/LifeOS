"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import type { MeasurementType } from "@/generated/prisma/client";

export interface LogWeightInput {
  weightKg: number;
  note?: string;
}

export async function logWeight(input: LogWeightInput) {
  const userId = await requireUserId();

  if (!Number.isFinite(input.weightKg) || input.weightKg < 20 || input.weightKg > 400) {
    throw new Error("Peso inválido.");
  }
  if (input.note && input.note.length > 280) {
    throw new Error("La nota es demasiado larga.");
  }

  await prisma.weightEntry.create({
    data: { userId, weightKg: input.weightKg, note: input.note?.trim() || null },
  });

  revalidatePath("/fitness/progress");
  revalidatePath("/fitness");
}

export interface LogMeasurementInput {
  type: MeasurementType;
  customLabel?: string;
  valueCm: number;
}

export async function logMeasurement(input: LogMeasurementInput) {
  const userId = await requireUserId();

  if (!Number.isFinite(input.valueCm) || input.valueCm < 1 || input.valueCm > 300) {
    throw new Error("Medida inválida.");
  }
  if (input.customLabel && input.customLabel.length > 60) {
    throw new Error("La etiqueta es demasiado larga.");
  }

  await prisma.bodyMeasurement.create({
    data: { userId, type: input.type, customLabel: input.customLabel?.trim() || null, valueCm: input.valueCm },
  });

  revalidatePath("/fitness/progress");
}
