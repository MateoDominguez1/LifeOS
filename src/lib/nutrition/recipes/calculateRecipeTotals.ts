export interface RecipeIngredientNutrition {
  quantityGrams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number | null;
}

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export function calculateRecipeTotals(ingredients: RecipeIngredientNutrition[]): NutritionTotals {
  return ingredients.reduce<NutritionTotals>(
    (acc, ing) => {
      const factor = ing.quantityGrams / 100;
      return {
        calories: acc.calories + ing.caloriesPer100g * factor,
        protein: acc.protein + ing.proteinPer100g * factor,
        carbs: acc.carbs + ing.carbsPer100g * factor,
        fat: acc.fat + ing.fatPer100g * factor,
        fiber: acc.fiber + (ing.fiberPer100g ?? 0) * factor,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

export function perServing(totals: NutritionTotals, servings: number): NutritionTotals {
  const s = servings > 0 ? servings : 1;
  return {
    calories: totals.calories / s,
    protein: totals.protein / s,
    carbs: totals.carbs / s,
    fat: totals.fat / s,
    fiber: totals.fiber / s,
  };
}
