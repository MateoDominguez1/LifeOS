"use client";

import type { FoodItem } from "@/generated/prisma/client";
import { useEffect, useRef, useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import type { Dictionary } from "@/lib/i18n";
import { createCustomFood, searchFoodsAction } from "./actions";

export function FoodSearch({ t }: { t: Dictionary }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [isSearching, startSearch] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      startSearch(async () => {
        const foods = await searchFoodsAction(trimmed);
        setResults(foods);
        setHasSearched(true);
      });
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="space-y-6">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.nutrition.foods.searchPlaceholder}
        className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-nutrition"
      />

      {isSearching && <p className="text-sm text-ink-faint">{t.nutrition.foods.searching}</p>}

      {!isSearching && hasSearched && results.length === 0 && (
        <p className="text-sm text-ink-faint">{t.nutrition.foods.noResults}</p>
      )}

      <div className="space-y-2">
        {results.map((food) => (
          <FoodResultCard key={food.id} food={food} t={t} />
        ))}
      </div>

      <ManualFoodForm t={t} />
    </div>
  );
}

function FoodResultCard({ food, t }: { food: FoodItem; t: Dictionary }) {
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-ink">{food.name}</span>
        <span className="shrink-0 text-xs text-ink-faint">
          {t.nutrition.foods.per100g}
          {food.commonPortionGrams ? ` · ${t.nutrition.foods.commonPortionPrefix} ${Math.round(food.commonPortionGrams)} g` : ""}
        </span>
      </div>
      <div className="mt-2 flex gap-4 text-xs text-ink-soft">
        <span>{Math.round(food.caloriesPer100g)} kcal</span>
        <span>{Math.round(food.proteinPer100g)} g {t.nutrition.common.macroProteinAbbrev}</span>
        <span>{Math.round(food.carbsPer100g)} g {t.nutrition.common.macroCarbsAbbrev}</span>
        <span>{Math.round(food.fatPer100g)} g {t.nutrition.common.macroFatAbbrev}</span>
        {food.fiberPer100g != null && <span>{Math.round(food.fiberPer100g)} g {t.nutrition.common.fiberUnitLabel}</span>}
      </div>
    </Card>
  );
}

function ManualFoodForm({ t }: { t: Dictionary }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createCustomFood({
          name,
          caloriesPer100g: Number(calories) || 0,
          proteinPer100g: Number(protein) || 0,
          carbsPer100g: Number(carbs) || 0,
          fatPer100g: Number(fat) || 0,
          fiberPer100g: fiber ? Number(fiber) : undefined,
        });
        setSaved(true);
        setName("");
        setCalories("");
        setProtein("");
        setCarbs("");
        setFat("");
        setFiber("");
      } catch {
        setError(t.nutrition.foods.saveError);
      }
    });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-ink-soft underline underline-offset-2 hover:text-ink">
        {t.nutrition.foods.addManualCta}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border-soft p-4">
      <p className="text-sm font-medium text-ink">{t.nutrition.foods.addManualTitle}</p>
      <input
        type="text"
        required
        placeholder={t.nutrition.foods.namePlaceholder}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          required
          placeholder={t.nutrition.foods.caloriesPlaceholder}
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
        />
        <input
          type="number"
          required
          placeholder={t.nutrition.foods.proteinPlaceholder}
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
        />
        <input
          type="number"
          required
          placeholder={t.nutrition.foods.carbsPlaceholder}
          value={carbs}
          onChange={(e) => setCarbs(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
        />
        <input
          type="number"
          required
          placeholder={t.nutrition.foods.fatPlaceholder}
          value={fat}
          onChange={(e) => setFat(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
        />
        <input
          type="number"
          placeholder={t.nutrition.foods.fiberPlaceholder}
          value={fiber}
          onChange={(e) => setFiber(e.target.value)}
          className="col-span-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-nutrition px-4 py-2 font-display text-sm font-medium text-white disabled:opacity-60"
        >
          {isPending ? t.common.saving : t.common.save}
        </button>
        {saved && <span className="text-xs text-money">{t.common.saved}</span>}
      </div>
    </form>
  );
}
