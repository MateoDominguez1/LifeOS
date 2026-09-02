"use client";

import type { FoodItem } from "@/generated/prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { searchFoodsAction } from "@/app/(app)/nutrition/foods/actions";
import { calculateRecipeTotals, perServing } from "@/lib/nutrition/recipes/calculateRecipeTotals";
import { createRecipe } from "./actions";

interface DraftIngredient {
  clientId: string;
  foodItemId: string;
  name: string;
  quantityGrams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number | null;
}

export function RecipeBuilder() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [servings, setServings] = useState(2);
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [isSearching, startSearch] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    startSearch(async () => {
      setResults(await searchFoodsAction(value));
    });
  }

  function addIngredient(food: FoodItem) {
    setIngredients((prev) => [
      ...prev,
      {
        clientId: `${food.id}-${Date.now()}`,
        foodItemId: food.id,
        name: food.name,
        quantityGrams: 100,
        caloriesPer100g: food.caloriesPer100g,
        proteinPer100g: food.proteinPer100g,
        carbsPer100g: food.carbsPer100g,
        fatPer100g: food.fatPer100g,
        fiberPer100g: food.fiberPer100g,
      },
    ]);
    setQuery("");
    setResults([]);
  }

  function updateQuantity(clientId: string, quantityGrams: number) {
    setIngredients((prev) => prev.map((ing) => (ing.clientId === clientId ? { ...ing, quantityGrams } : ing)));
  }

  function removeIngredient(clientId: string) {
    setIngredients((prev) => prev.filter((ing) => ing.clientId !== clientId));
  }

  const totals = calculateRecipeTotals(ingredients);
  const perServ = perServing(totals, servings);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || ingredients.length === 0) {
      setError("Agregá un nombre y al menos un ingrediente.");
      return;
    }
    startSaving(async () => {
      try {
        await createRecipe({
          name,
          servings,
          ingredients: ingredients.map((i) => ({ foodItemId: i.foodItemId, quantityGrams: i.quantityGrams })),
        });
        router.refresh();
        setName("");
        setIngredients([]);
        setServings(2);
      } catch {
        setError("No pudimos guardar la receta.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border-soft bg-surface p-4">
      <p className="font-display text-sm font-medium text-ink">Nueva receta</p>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Nombre de la receta"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
        />
        <input
          type="number"
          min={1}
          value={servings}
          onChange={(e) => setServings(Number(e.target.value) || 1)}
          className="w-20 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
          title="Porciones"
        />
      </div>

      <div className="space-y-2">
        {ingredients.map((ing) => (
          <div key={ing.clientId} className="flex items-center gap-2 text-sm">
            <span className="flex-1 truncate text-ink">{ing.name}</span>
            <input
              type="number"
              value={ing.quantityGrams}
              onChange={(e) => updateQuantity(ing.clientId, Number(e.target.value) || 0)}
              className="w-16 rounded-lg border border-border bg-surface px-2 py-1 text-xs text-ink"
            />
            <span className="text-xs text-ink-faint">g</span>
            <button type="button" onClick={() => removeIngredient(ing.clientId)} className="text-xs text-ink-faint hover:text-danger">
              Quitar
            </button>
          </div>
        ))}
      </div>

      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="+ Agregar ingrediente"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
        />
        {isSearching && <p className="mt-1 text-xs text-ink-faint">Buscando...</p>}
        {results.length > 0 && (
          <div className="mt-1 space-y-1">
            {results.slice(0, 6).map((food) => (
              <button
                key={food.id}
                type="button"
                onClick={() => addIngredient(food)}
                className="block w-full rounded-lg border border-border px-3 py-1.5 text-left text-xs text-ink hover:bg-surface-raised"
              >
                {food.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {ingredients.length > 0 && (
        <div className="rounded-xl bg-surface-raised p-3 text-xs text-ink-soft">
          <p>
            Total: {Math.round(totals.calories)} kcal · {Math.round(totals.protein)}g P · {Math.round(totals.carbs)}g C · {Math.round(totals.fat)}g G
          </p>
          <p>
            Por porción: {Math.round(perServ.calories)} kcal · {Math.round(perServ.protein)}g P
          </p>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-xl bg-nutrition px-4 py-2.5 font-display text-sm font-medium text-white disabled:opacity-60"
      >
        {isSaving ? "Guardando..." : "Guardar receta"}
      </button>
    </form>
  );
}
