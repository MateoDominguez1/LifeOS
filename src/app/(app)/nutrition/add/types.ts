export interface DraftMealFood {
  clientId: string;
  displayName: string;
  preparationMethod?: string;
  estimatedGrams: number;
  aiConfidence: number | null;
  foodItemId: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number | null;
}

export interface DraftMeal {
  mealName: string;
  confidence: number | null;
  foods: DraftMealFood[];
}

export function computeFoodTotals(food: DraftMealFood) {
  const factor = food.estimatedGrams / 100;
  return {
    calories: Math.round(food.caloriesPer100g * factor),
    protein: Math.round(food.proteinPer100g * factor),
    carbs: Math.round(food.carbsPer100g * factor),
    fat: Math.round(food.fatPer100g * factor),
    fiber: food.fiberPer100g != null ? Math.round(food.fiberPer100g * factor) : null,
  };
}

export function computeMealTotals(foods: DraftMealFood[]) {
  return foods.reduce(
    (acc, food) => {
      const t = computeFoodTotals(food);
      return {
        calories: acc.calories + t.calories,
        protein: acc.protein + t.protein,
        carbs: acc.carbs + t.carbs,
        fat: acc.fat + t.fat,
        fiber: acc.fiber + (t.fiber ?? 0),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}
