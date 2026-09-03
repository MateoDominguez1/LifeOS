"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { aiProvider } from "@/lib/fitness/ai/rules-provider";
import { getT } from "@/lib/i18n";
import type { OnboardingData } from "./types";

export async function completeOnboarding(data: OnboardingData) {
  const [userId, { t }] = await Promise.all([requireUserId(), getT()]);

  if (
    !data.age ||
    !data.sex ||
    !data.heightCm ||
    !data.weightKg ||
    !data.weightGoalKg ||
    !data.level ||
    !data.primaryGoal ||
    data.trainingDays.length === 0 ||
    data.equipment.length === 0
  ) {
    throw new Error(t.fitness.onboarding.missingRequiredError);
  }

  if (
    data.age < 13 ||
    data.age > 100 ||
    data.heightCm < 100 ||
    data.heightCm > 250 ||
    data.weightKg < 30 ||
    data.weightKg > 300 ||
    data.weightGoalKg < 30 ||
    data.weightGoalKg > 300
  ) {
    throw new Error(t.fitness.onboarding.outOfRangeError);
  }

  await prisma.bodyProfile.upsert({
    where: { userId },
    create: { userId, age: data.age, sex: data.sex, heightCm: data.heightCm },
    update: { age: data.age, sex: data.sex, heightCm: data.heightCm },
  });

  const fitnessProfileFields = {
    level: data.level,
    primaryGoal: data.primaryGoal,
    secondaryGoals: data.secondaryGoals,
    daysPerWeek: data.trainingDays.length,
    trainingDays: data.trainingDays,
    sessionDurationMin: data.sessionDurationMin,
    equipment: data.equipment,
    favoriteExerciseIds: data.favoriteExerciseIds,
    excludedExerciseIds: data.excludedExerciseIds,
    priorityMuscles: data.priorityMuscles,
    cardioPreference: data.cardioPreference,
    limitations: data.limitations || null,
    rirRpeMode: data.rirRpeMode,
    onboardingCompletedAt: new Date(),
  };

  const profile = await prisma.fitnessProfile.upsert({
    where: { userId },
    create: { userId, ...fitnessProfileFields },
    update: fitnessProfileFields,
  });

  await prisma.weightEntry.create({ data: { userId, weightKg: data.weightKg } });

  const existingWeightGoal = await prisma.goal.findFirst({
    where: { userId, domain: "BODY", metric: "BODY_WEIGHT", status: "ACTIVE" },
  });
  if (existingWeightGoal) {
    await prisma.goal.update({ where: { id: existingWeightGoal.id }, data: { targetValue: data.weightGoalKg } });
  } else {
    await prisma.goal.create({
      data: {
        userId,
        domain: "BODY",
        metric: "BODY_WEIGHT",
        label: `${t.fitness.onboarding.weightGoalLabelPrefix} ${data.weightGoalKg} kg`,
        targetValue: data.weightGoalKg,
        currentValue: data.weightKg,
      },
    });
  }

  const exercisePool = await prisma.exercise.findMany();
  const plan = aiProvider.generateWorkoutPlan({ ...profile, userId }, exercisePool, t.fitness.defaultRoutineName);

  await prisma.workoutProgram.updateMany({ where: { userId, active: true }, data: { active: false } });

  await prisma.workoutProgram.create({
    data: {
      userId,
      name: plan.name,
      active: true,
      source: "AI",
      days: {
        create: plan.days.map((day) => ({
          dayOfWeek: day.dayOfWeek,
          label: day.label,
          order: day.order,
          exercises: {
            create: day.exercises.map((ex) => ({
              exerciseId: ex.exerciseId,
              order: ex.order,
              targetSets: ex.targetSets,
              targetRepsMin: ex.targetRepsMin,
              targetRepsMax: ex.targetRepsMax,
              restSeconds: ex.restSeconds,
              targetRir: ex.targetRir,
              targetRpe: ex.targetRpe,
            })),
          },
        })),
      },
    },
  });

  redirect("/fitness");
}
