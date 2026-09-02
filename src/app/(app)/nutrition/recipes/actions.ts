"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { calculateRecipeTotals } from "@/lib/nutrition/recipes/calculateRecipeTotals";

export interface RecipeIngredientInput {
  foodItemId: string;
  quantityGrams: number;
}

export async function createRecipe(input: {
  name: string;
  servings: number;
  ingredients: RecipeIngredientInput[];
}) {
  const userId = await requireUserId();

  if (!input.name.trim() || input.ingredients.length === 0) {
    throw new Error("La receta necesita un nombre y al menos un ingrediente.");
  }
  if (input.ingredients.some((ing) => !Number.isFinite(ing.quantityGrams) || ing.quantityGrams <= 0)) {
    throw new Error("Las cantidades de los ingredientes deben ser mayores a 0.");
  }

  const recipe = await prisma.recipe.create({
    data: {
      userId,
      name: input.name.trim(),
      servings: Math.max(1, Math.round(input.servings)),
      ingredients: {
        create: input.ingredients.map((ing) => ({
          foodItemId: ing.foodItemId,
          quantityGrams: ing.quantityGrams,
        })),
      },
    },
  });

  revalidatePath("/nutrition/recipes");
  return { id: recipe.id };
}

export async function deleteRecipe(recipeId: string) {
  const userId = await requireUserId();

  await prisma.recipe.deleteMany({ where: { id: recipeId, userId } });
  revalidatePath("/nutrition/recipes");
}

export async function logRecipeAsMeal(
  recipeId: string,
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK",
  servingsConsumed: number
) {
  const userId = await requireUserId();

  if (!Number.isFinite(servingsConsumed) || servingsConsumed <= 0 || servingsConsumed > 50) {
    throw new Error("Cantidad de porciones inválida.");
  }

  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, userId },
    include: { ingredients: { include: { foodItem: true } } },
  });
  if (!recipe) throw new Error("Receta no encontrada.");

  const scale = servingsConsumed / recipe.servings;

  const foods = recipe.ingredients
    .filter((ing) => ing.foodItem)
    .map((ing) => {
      const grams = ing.quantityGrams * scale;
      const factor = grams / 100;
      const fi = ing.foodItem!;
      return {
        foodItemId: fi.id,
        foodNameSnapshot: fi.name,
        quantityGrams: grams,
        calories: fi.caloriesPer100g * factor,
        protein: fi.proteinPer100g * factor,
        carbs: fi.carbsPer100g * factor,
        fat: fi.fatPer100g * factor,
        fiber: (fi.fiberPer100g ?? 0) * factor,
      };
    });

  const totals = calculateRecipeTotals(
    recipe.ingredients
      .filter((ing) => ing.foodItem)
      .map((ing) => ({
        quantityGrams: ing.quantityGrams * scale,
        caloriesPer100g: ing.foodItem!.caloriesPer100g,
        proteinPer100g: ing.foodItem!.proteinPer100g,
        carbsPer100g: ing.foodItem!.carbsPer100g,
        fatPer100g: ing.foodItem!.fatPer100g,
        fiberPer100g: ing.foodItem!.fiberPer100g,
      }))
  );

  await prisma.meal.create({
    data: {
      userId,
      mealType,
      name: recipe.name,
      isAiGenerated: false,
      isConfirmed: true,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
      totalFiber: totals.fiber,
      foods: { create: foods },
    },
  });

  revalidatePath("/nutrition");
  return { ok: true as const };
}
