import { prisma } from "@/lib/db/prisma";
import { calculateRecipeTotals, perServing, type NutritionTotals } from "./calculateRecipeTotals";

export interface MealSuggestion {
  recipeId: string;
  name: string;
  perServing: NutritionTotals;
}

export interface RemainingBudget {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export async function suggestMeals(userId: string, remaining: RemainingBudget): Promise<MealSuggestion[]> {
  const recipes = await prisma.recipe.findMany({
    where: { userId },
    include: { ingredients: { include: { foodItem: true } } },
  });

  const scored = recipes
    .map((recipe) => {
      const totals = calculateRecipeTotals(
        recipe.ingredients
          .filter((ing) => ing.foodItem)
          .map((ing) => ({
            quantityGrams: ing.quantityGrams,
            caloriesPer100g: ing.foodItem!.caloriesPer100g,
            proteinPer100g: ing.foodItem!.proteinPer100g,
            carbsPer100g: ing.foodItem!.carbsPer100g,
            fatPer100g: ing.foodItem!.fatPer100g,
            fiberPer100g: ing.foodItem!.fiberPer100g,
          }))
      );
      const perServ = perServing(totals, recipe.servings);

      const calorieDiff = Math.abs(perServ.calories - remaining.calories) / Math.max(remaining.calories, 1);
      const proteinDiff = Math.abs(perServ.protein - remaining.protein) / Math.max(remaining.protein, 1);
      const score = calorieDiff * 0.6 + proteinDiff * 0.4;

      return { recipeId: recipe.id, name: recipe.name, perServing: perServ, score };
    })
    .sort((a, b) => a.score - b.score);

  return scored.map(({ recipeId, name, perServing: p }) => ({ recipeId, name, perServing: p }));
}
