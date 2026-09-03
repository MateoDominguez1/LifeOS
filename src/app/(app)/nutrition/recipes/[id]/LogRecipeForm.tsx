"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import type { Dictionary } from "@/lib/i18n";
import { logRecipeAsMeal } from "../actions";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

const MEAL_TYPE_VALUES: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

export function LogRecipeForm({
  recipeId,
  defaultServings,
  t,
}: {
  recipeId: string;
  defaultServings: number;
  t: Dictionary;
}) {
  const router = useRouter();
  const [mealType, setMealType] = useState<MealType>("LUNCH");
  const [servings, setServings] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleLog() {
    setError(null);
    startTransition(async () => {
      try {
        await logRecipeAsMeal(recipeId, mealType, servings);
        router.push("/nutrition");
        router.refresh();
      } catch {
        setError(t.nutrition.recipes.logSaveError);
      }
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border-soft p-4">
      <p className="font-display text-sm font-medium text-ink">{t.nutrition.recipes.logAsMealTitle}</p>
      <div className="grid grid-cols-4 gap-2">
        {MEAL_TYPE_VALUES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMealType(value)}
            className={cn(
              "rounded-lg border px-2 py-2 font-display text-xs font-medium transition-colors",
              mealType === value ? "border-nutrition bg-nutrition-soft text-nutrition" : "border-border text-ink-soft"
            )}
          >
            {t.mealTypes[value]}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        {t.nutrition.recipes.servingsConsumedLabel}
        <input
          type="number"
          step={0.5}
          min={0.5}
          max={defaultServings}
          value={servings}
          onChange={(e) => setServings(Number(e.target.value) || 1)}
          className="w-20 rounded-lg border border-border bg-surface px-2 py-1 text-ink"
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="button"
        disabled={isPending}
        onClick={handleLog}
        className="w-full rounded-xl bg-nutrition px-4 py-2.5 font-display text-sm font-medium text-white disabled:opacity-60"
      >
        {isPending ? t.common.saving : t.nutrition.recipes.register}
      </button>
    </div>
  );
}
