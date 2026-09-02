"use server";

import { requireUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { analyzeFoodDescription, analyzeFoodImage } from "@/lib/nutrition/ai/analyzeFoodImage";
import { matchFoodToDatabase } from "@/lib/nutrition/food/match";
import { computeFoodTotals, type DraftMeal, type DraftMealFood } from "./types";

const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BASE64_LENGTH = 8_000_000; // ~6MB decoded, generous for a compressed photo

export async function analyzeMealPhoto(
  imageBase64: string,
  mimeType: string
): Promise<DraftMeal> {
  await requireUserId();

  if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    throw new Error("Formato de imagen no soportado.");
  }
  if (imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
    throw new Error("La imagen es demasiado grande.");
  }

  const analysis = await analyzeFoodImage(imageBase64, mimeType);

  const foods: DraftMealFood[] = await Promise.all(
    analysis.foods.map(async (food, index) => {
      const match = await matchFoodToDatabase(food.name);
      return {
        clientId: `${Date.now()}-${index}`,
        displayName: food.displayName,
        preparationMethod: food.preparationMethod,
        estimatedGrams: Math.round(food.estimatedGrams),
        aiConfidence: food.confidence,
        foodItemId: match?.id ?? null,
        caloriesPer100g: match?.caloriesPer100g ?? 0,
        proteinPer100g: match?.proteinPer100g ?? 0,
        carbsPer100g: match?.carbsPer100g ?? 0,
        fatPer100g: match?.fatPer100g ?? 0,
        fiberPer100g: match?.fiberPer100g ?? null,
      };
    })
  );

  return {
    mealName: analysis.mealName,
    confidence: analysis.confidence,
    foods,
  };
}

const MAX_DESCRIPTION_LENGTH = 500;

export async function analyzeMealDescription(description: string): Promise<DraftMeal> {
  await requireUserId();

  const trimmed = description.trim();
  if (!trimmed) {
    throw new Error("Escribí qué comiste.");
  }
  if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error("La descripción es demasiado larga.");
  }

  const analysis = await analyzeFoodDescription(trimmed);

  const foods: DraftMealFood[] = await Promise.all(
    analysis.foods.map(async (food, index) => {
      const match = await matchFoodToDatabase(food.name);
      return {
        clientId: `${Date.now()}-${index}`,
        displayName: food.displayName,
        preparationMethod: food.preparationMethod,
        estimatedGrams: Math.round(food.estimatedGrams),
        aiConfidence: food.confidence,
        foodItemId: match?.id ?? null,
        caloriesPer100g: match?.caloriesPer100g ?? 0,
        proteinPer100g: match?.proteinPer100g ?? 0,
        carbsPer100g: match?.carbsPer100g ?? 0,
        fatPer100g: match?.fatPer100g ?? 0,
        fiberPer100g: match?.fiberPer100g ?? null,
      };
    })
  );

  return {
    mealName: analysis.mealName,
    confidence: analysis.confidence,
    foods,
  };
}

export interface ConfirmMealInput {
  mealName: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  confidence: number | null;
  foods: DraftMealFood[];
  photoDataUrl?: string;
}

export async function confirmMeal(input: ConfirmMealInput) {
  const userId = await requireUserId();

  if (input.foods.length === 0) {
    throw new Error("La comida necesita al menos un alimento.");
  }
  if (input.photoDataUrl && input.photoDataUrl.length > MAX_IMAGE_BASE64_LENGTH) {
    throw new Error("La imagen es demasiado grande.");
  }

  const foodsWithTotals = input.foods.map((food) => ({
    food,
    totals: computeFoodTotals(food),
  }));

  const totals = foodsWithTotals.reduce(
    (acc, { totals: t }) => ({
      calories: acc.calories + t.calories,
      protein: acc.protein + t.protein,
      carbs: acc.carbs + t.carbs,
      fat: acc.fat + t.fat,
      fiber: acc.fiber + (t.fiber ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  const meal = await prisma.meal.create({
    data: {
      userId,
      mealType: input.mealType,
      name: input.mealName,
      photoUrl: input.photoDataUrl,
      aiConfidence: input.confidence ?? undefined,
      isAiGenerated: true,
      isConfirmed: true,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
      totalFiber: totals.fiber,
      foods: {
        create: foodsWithTotals.map(({ food, totals: t }) => ({
          foodItemId: food.foodItemId ?? undefined,
          foodNameSnapshot: food.displayName,
          quantityGrams: food.estimatedGrams,
          calories: t.calories,
          protein: t.protein,
          carbs: t.carbs,
          fat: t.fat,
          fiber: t.fiber ?? 0,
          confidence: food.aiConfidence ?? undefined,
          preparationMethod: food.preparationMethod,
        })),
      },
    },
  });

  return { id: meal.id };
}
