"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import type { GoalDomain, GoalMetric, MeasurementType } from "@/generated/prisma/client";

export interface CreateGoalInput {
  domain: GoalDomain;
  metric: GoalMetric;
  label: string;
  targetValue: number;
  targetDate?: string;
  exerciseId?: string;
  measurementType?: MeasurementType;
  accountId?: string;
}

export async function createGoal(input: CreateGoalInput) {
  const userId = await requireUserId();

  if (!input.label.trim()) {
    throw new Error("El objetivo necesita un nombre.");
  }
  if (!Number.isFinite(input.targetValue) || input.targetValue <= 0) {
    throw new Error("El valor objetivo debe ser mayor a 0.");
  }
  if (input.metric === "SAVINGS" && !input.accountId) {
    throw new Error("Elegí una cuenta para el objetivo de ahorro.");
  }
  if (input.metric === "EXERCISE_WEIGHT" && !input.exerciseId) {
    throw new Error("Elegí un ejercicio.");
  }
  if (input.metric === "BODY_MEASUREMENT" && !input.measurementType) {
    throw new Error("Elegí qué medida vas a trackear.");
  }

  await prisma.goal.create({
    data: {
      userId,
      domain: input.domain,
      metric: input.metric,
      label: input.label.trim(),
      targetValue: input.targetValue,
      targetDate: input.targetDate ? new Date(input.targetDate) : null,
      exerciseId: input.metric === "EXERCISE_WEIGHT" ? input.exerciseId : null,
      measurementType: input.metric === "BODY_MEASUREMENT" ? input.measurementType : null,
      accountId: input.metric === "SAVINGS" ? input.accountId : null,
    },
  });

  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function updateGoalTarget(goalId: string, targetValue: number, targetDate?: string) {
  const userId = await requireUserId();

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal || goal.userId !== userId) throw new Error("No autorizado");

  if (!Number.isFinite(targetValue) || targetValue <= 0) {
    throw new Error("El valor objetivo debe ser mayor a 0.");
  }

  await prisma.goal.update({
    where: { id: goalId },
    data: { targetValue, targetDate: targetDate ? new Date(targetDate) : null },
  });

  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function markGoalAchieved(goalId: string) {
  const userId = await requireUserId();

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal || goal.userId !== userId) throw new Error("No autorizado");

  await prisma.goal.update({ where: { id: goalId }, data: { status: "ACHIEVED" } });

  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function abandonGoal(goalId: string) {
  const userId = await requireUserId();

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal || goal.userId !== userId) throw new Error("No autorizado");

  await prisma.goal.update({ where: { id: goalId }, data: { status: "ABANDONED" } });

  revalidatePath("/goals");
  revalidatePath("/dashboard");
}
