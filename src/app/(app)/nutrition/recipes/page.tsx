import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { NutritionNav } from "@/components/nutrition/nutrition-nav";
import { calculateRecipeTotals, perServing } from "@/lib/nutrition/recipes/calculateRecipeTotals";
import { getT } from "@/lib/i18n";
import { RecipeBuilder } from "./RecipeBuilder";

export default async function NutritionRecipesPage() {
  const [userId, { t }] = await Promise.all([requireUserId(), getT()]);

  const recipes = await prisma.recipe.findMany({
    where: { userId },
    include: { ingredients: { include: { foodItem: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <NutritionNav />

      <h1 className="mb-4 font-display text-xl font-bold text-ink">{t.nutrition.recipes.title}</h1>

      <div className="mb-6 space-y-2">
        {recipes.length === 0 && <p className="text-sm text-ink-faint">{t.nutrition.recipes.empty}</p>}
        {recipes.map((recipe) => {
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
            <Link
              key={recipe.id}
              href={`/nutrition/recipes/${recipe.id}`}
              className="block rounded-xl border border-border-soft p-3 hover:bg-surface-raised"
            >
              <p className="text-sm font-medium text-ink">{recipe.name}</p>
              <p className="text-xs text-ink-faint">
                {recipe.servings} {t.nutrition.recipes.servingsUnit} · {Math.round(perServ.calories)} {t.nutrition.recipes.perServingUnit}
              </p>
            </Link>
          );
        })}
      </div>

      <RecipeBuilder t={t} />
    </div>
  );
}
