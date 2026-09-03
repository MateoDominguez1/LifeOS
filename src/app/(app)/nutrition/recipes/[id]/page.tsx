import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { NutritionNav } from "@/components/nutrition/nutrition-nav";
import { calculateRecipeTotals, perServing } from "@/lib/nutrition/recipes/calculateRecipeTotals";
import { getT } from "@/lib/i18n";
import { LogRecipeForm } from "./LogRecipeForm";

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [userId, { t }] = await Promise.all([requireUserId(), getT()]);
  const { id } = await params;

  const recipe = await prisma.recipe.findFirst({
    where: { id, userId },
    include: { ingredients: { include: { foodItem: true } } },
  });
  if (!recipe) notFound();

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

  return (
    <div>
      <NutritionNav />

      <h1 className="font-display text-xl font-bold text-ink">{recipe.name}</h1>
      <p className="mb-4 text-sm text-ink-soft">{recipe.servings} {t.nutrition.recipes.servingsUnit}</p>

      <div className="mb-6 rounded-2xl border border-border-soft p-4 text-center">
        <p className="font-display text-2xl font-bold text-ink">{Math.round(perServ.calories)} kcal</p>
        <p className="text-xs text-ink-faint">{t.nutrition.recipes.perServingText}</p>
        <div className="mt-2 flex justify-center gap-4 text-sm text-ink-soft">
          <span>{Math.round(perServ.protein)} g {t.nutrition.common.macroProteinAbbrev}</span>
          <span>{Math.round(perServ.carbs)} g {t.nutrition.common.macroCarbsAbbrev}</span>
          <span>{Math.round(perServ.fat)} g {t.nutrition.common.macroFatAbbrev}</span>
        </div>
      </div>

      <div className="mb-6 space-y-2">
        <h2 className="font-display text-sm font-medium text-ink-soft">{t.nutrition.recipes.ingredientsTitle}</h2>
        {recipe.ingredients.map((ing) => (
          <div key={ing.id} className="flex justify-between text-sm text-ink">
            <span>{ing.foodItem?.name ?? t.nutrition.recipes.deletedFoodFallback}</span>
            <span className="text-ink-faint">{Math.round(ing.quantityGrams)} g</span>
          </div>
        ))}
      </div>

      <LogRecipeForm recipeId={recipe.id} defaultServings={recipe.servings} t={t} />
    </div>
  );
}
