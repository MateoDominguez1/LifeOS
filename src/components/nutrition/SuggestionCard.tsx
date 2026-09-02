"use client";

import Link from "next/link";
import { useState } from "react";
import type { MealSuggestion } from "@/lib/nutrition/recipes/suggestMeals";
import { Card } from "@/components/ui/card";

export function SuggestionCard({ suggestions }: { suggestions: MealSuggestion[] }) {
  const [index, setIndex] = useState(0);

  if (suggestions.length === 0) return null;

  const current = suggestions[index % suggestions.length];

  return (
    <Card domain="nutrition">
      <p className="font-display text-xs font-medium text-ink-faint">Podrías comer</p>
      <Link href={`/nutrition/recipes/${current.recipeId}`} className="mt-1 block text-sm font-medium text-ink hover:underline">
        {current.name}
      </Link>
      <p className="mt-1 text-xs text-ink-soft">
        ≈ {Math.round(current.perServing.calories)} kcal · {Math.round(current.perServing.protein)} g proteína ·{" "}
        {Math.round(current.perServing.carbs)} g carbos · {Math.round(current.perServing.fat)} g grasa
      </p>
      {suggestions.length > 1 && (
        <button
          type="button"
          onClick={() => setIndex((i) => i + 1)}
          className="mt-2 text-xs text-ink-faint underline underline-offset-2 hover:text-ink"
        >
          Dame otra opción
        </button>
      )}
    </Card>
  );
}
