"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { calculateNutritionGoals } from "@/lib/nutrition/calculations";
import type { ActivityLevel, GoalType, Sex } from "@/lib/nutrition/types";

export interface UpdateProfileInput {
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  weightGoalKg: number | null;
  activityLevel: ActivityLevel;
  goalType: GoalType;
}

export async function updateProfile(input: UpdateProfileInput) {
  const userId = await requireUserId();

  const existing = await prisma.nutritionProfile.findUnique({ where: { userId } });
  if (!existing) {
    throw new Error("Perfil no encontrado.");
  }

  if (
    input.age < 10 ||
    input.age > 100 ||
    input.heightCm < 100 ||
    input.heightCm > 250 ||
    input.weightKg < 30 ||
    input.weightKg > 300 ||
    (input.weightGoalKg != null && (input.weightGoalKg < 30 || input.weightGoalKg > 300))
  ) {
    throw new Error("Alguno de los valores ingresados está fuera de rango.");
  }

  await prisma.bodyProfile.upsert({
    where: { userId },
    create: { userId, age: input.age, sex: input.sex, heightCm: input.heightCm },
    update: { age: input.age, sex: input.sex, heightCm: input.heightCm },
  });

  await prisma.nutritionProfile.update({
    where: { userId },
    data: { activityLevel: input.activityLevel, goalType: input.goalType },
  });

  // WeightEntry is an append-only log (unlike the original app's mutable
  // UserProfile.weightKg cache), so only log a new point when the value
  // actually moved — otherwise every profile save would add a duplicate
  // point to the weight chart.
  const latestWeight = await prisma.weightEntry.findFirst({ where: { userId }, orderBy: { loggedAt: "desc" } });
  if (!latestWeight || latestWeight.weightKg !== input.weightKg) {
    await prisma.weightEntry.create({ data: { userId, weightKg: input.weightKg } });
  }

  const existingWeightGoal = await prisma.goal.findFirst({
    where: { userId, domain: "BODY", metric: "BODY_WEIGHT", status: "ACTIVE" },
  });
  if (input.weightGoalKg == null) {
    if (existingWeightGoal) {
      await prisma.goal.delete({ where: { id: existingWeightGoal.id } });
    }
  } else if (existingWeightGoal) {
    await prisma.goal.update({ where: { id: existingWeightGoal.id }, data: { targetValue: input.weightGoalKg } });
  } else {
    await prisma.goal.create({
      data: {
        userId,
        domain: "BODY",
        metric: "BODY_WEIGHT",
        label: `Peso objetivo: ${input.weightGoalKg} kg`,
        targetValue: input.weightGoalKg,
        currentValue: input.weightKg,
      },
    });
  }

  const currentGoals = await prisma.nutritionGoals.findUnique({ where: { userId } });

  if (currentGoals && !currentGoals.isManualOverride) {
    const recalculated = calculateNutritionGoals({
      sex: input.sex,
      age: input.age,
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      activityLevel: input.activityLevel,
      goalType: input.goalType,
    });

    await prisma.nutritionGoals.update({
      where: { userId },
      data: recalculated,
    });
  }

  revalidatePath("/nutrition/profile");
  revalidatePath("/nutrition");
}

export async function setManualOverride(isManualOverride: boolean) {
  const userId = await requireUserId();

  await prisma.nutritionGoals.update({
    where: { userId },
    data: { isManualOverride },
  });

  revalidatePath("/nutrition/profile");
}

export interface UpdateGoalsInput {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water: number;
}

export async function updateGoals(input: UpdateGoalsInput) {
  const userId = await requireUserId();

  const values = [input.calories, input.protein, input.carbs, input.fat, input.fiber, input.water];
  if (values.some((v) => !Number.isFinite(v) || v < 0) || input.calories > 10000 || input.water > 15) {
    throw new Error("Alguno de los objetivos ingresados está fuera de rango.");
  }

  await prisma.nutritionGoals.update({
    where: { userId },
    data: { ...input, isManualOverride: true },
  });

  revalidatePath("/nutrition/profile");
  revalidatePath("/nutrition");
}
