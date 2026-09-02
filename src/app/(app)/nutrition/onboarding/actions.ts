"use server";

import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { calculateNutritionGoals } from "@/lib/nutrition/calculations";
import { splitList, type OnboardingData } from "./types";

export async function completeOnboarding(data: OnboardingData) {
  const userId = await requireUserId();

  if (
    !data.sex ||
    !data.age ||
    !data.heightCm ||
    !data.weightKg ||
    !data.activityLevel ||
    !data.goalType
  ) {
    throw new Error("Faltan datos obligatorios del onboarding.");
  }

  if (
    data.age < 10 ||
    data.age > 100 ||
    data.heightCm < 100 ||
    data.heightCm > 250 ||
    data.weightKg < 30 ||
    data.weightKg > 300
  ) {
    throw new Error("Alguno de los valores ingresados está fuera de rango.");
  }

  const computed = calculateNutritionGoals({
    sex: data.sex,
    age: data.age,
    heightCm: data.heightCm,
    weightKg: data.weightKg,
    activityLevel: data.activityLevel,
    goalType: data.goalType,
    goalRateKgPerWeek: data.goalRateKgPerWeek ?? undefined,
  });

  const goals = {
    calories: data.manualCalories ?? computed.calories,
    protein: data.manualProtein ?? computed.protein,
    carbs: data.manualCarbs ?? computed.carbs,
    fat: data.manualFat ?? computed.fat,
    fiber: data.manualFiber ?? computed.fiber,
    water: data.manualWater ?? computed.water,
  };

  const bodyFields = {
    age: data.age,
    sex: data.sex,
    heightCm: data.heightCm,
  };

  const nutritionProfileFields = {
    activityLevel: data.activityLevel,
    isSedentaryJob: data.isSedentaryJob,
    trainingDaysPerWeek: data.trainingDaysPerWeek,
    trainingDurationMin: data.trainingDurationMin,
    otherSports: data.otherSports || null,
    goalType: data.goalType,
    goalRateKgPerWeek: data.goalRateKgPerWeek,
    goalTargetDate: data.goalTargetDate ? new Date(data.goalTargetDate) : null,
    mealsPerDay: data.mealsPerDay,
    dietaryPreference: data.dietaryPreference || null,
    allergies: splitList(data.allergies),
    dietType: data.dietType || null,
    favoriteFoods: splitList(data.favoriteFoods),
    limitedFoods: splitList(data.limitedFoods),
    autoRecalculateGoals: !data.isManualOverride,
  };

  const trackingFields = {
    trackCalories: data.trackCalories,
    trackProtein: data.trackProtein,
    trackCarbs: data.trackCarbs,
    trackFat: data.trackFat,
    trackFiber: data.trackFiber,
    trackWater: data.trackWater,
    trackSugar: data.trackSugar,
    trackMicronutrients: data.trackMicronutrients,
    isManualOverride: data.isManualOverride,
  };

  await prisma.$transaction([
    prisma.bodyProfile.upsert({
      where: { userId },
      create: { userId, ...bodyFields },
      update: bodyFields,
    }),
    prisma.nutritionProfile.upsert({
      where: { userId },
      create: { userId, ...nutritionProfileFields },
      update: nutritionProfileFields,
    }),
    prisma.nutritionGoals.upsert({
      where: { userId },
      create: { userId, ...goals, ...trackingFields },
      update: { ...goals, ...trackingFields },
    }),
    prisma.weightEntry.create({
      data: { userId, weightKg: data.weightKg },
    }),
    ...(data.weightGoalKg != null
      ? [
          prisma.goal.create({
            data: {
              userId,
              domain: "BODY" as const,
              metric: "BODY_WEIGHT" as const,
              label: `Peso objetivo: ${data.weightGoalKg} kg`,
              targetValue: data.weightGoalKg,
              currentValue: data.weightKg,
            },
          }),
        ]
      : []),
  ]);

  return { ok: true as const };
}
