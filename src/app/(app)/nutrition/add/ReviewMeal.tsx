"use client";

import type { FoodItem } from "@/generated/prisma/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { searchFoodsAction } from "@/app/(app)/nutrition/foods/actions";
import { confirmMeal } from "./actions";
import { confidenceLabel, inferMealType } from "./confidence";
import { computeFoodTotals, computeMealTotals, type DraftMeal, type DraftMealFood } from "./types";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: "BREAKFAST", label: "Desayuno" },
  { value: "LUNCH", label: "Almuerzo" },
  { value: "DINNER", label: "Cena" },
  { value: "SNACK", label: "Snack" },
];

export function ReviewMeal({
  photoDataUrl,
  draft,
  onRestart,
}: {
  photoDataUrl?: string;
  draft: DraftMeal;
  onRestart: () => void;
}) {
  const router = useRouter();
  const [mealName, setMealName] = useState(draft.mealName);
  const [mealType, setMealType] = useState(inferMealType());
  const [foods, setFoods] = useState(draft.foods);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  const totals = computeMealTotals(foods);

  function updateFood(clientId: string, patch: Partial<DraftMealFood>) {
    setFoods((prev) => prev.map((f) => (f.clientId === clientId ? { ...f, ...patch } : f)));
  }

  function removeFood(clientId: string) {
    setFoods((prev) => prev.filter((f) => f.clientId !== clientId));
  }

  function addFood(food: FoodItem) {
    setFoods((prev) => [
      ...prev,
      {
        clientId: `manual-${Date.now()}`,
        displayName: food.name,
        estimatedGrams: 100,
        aiConfidence: null,
        foodItemId: food.id,
        caloriesPer100g: food.caloriesPer100g,
        proteinPer100g: food.proteinPer100g,
        carbsPer100g: food.carbsPer100g,
        fatPer100g: food.fatPer100g,
        fiberPer100g: food.fiberPer100g,
      },
    ]);
  }

  function handleConfirm() {
    setError(null);
    startSaving(async () => {
      try {
        await confirmMeal({
          mealName,
          mealType,
          confidence: draft.confidence,
          foods,
          photoDataUrl,
        });
        router.push("/nutrition");
        router.refresh();
      } catch {
        setError("No pudimos guardar la comida. Intentá de nuevo.");
      }
    });
  }

  const overall = confidenceLabel(draft.confidence);

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <div className="flex gap-4">
        {photoDataUrl && (
          <Image src={photoDataUrl} alt="Comida analizada" width={96} height={96} unoptimized className="h-24 w-24 shrink-0 rounded-xl object-cover" />
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <input
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 font-display text-lg font-semibold text-ink"
          />
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${overall.className}`}>{overall.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {MEAL_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setMealType(t.value)}
            className={cn(
              "rounded-lg border px-2 py-2 font-display text-xs font-medium transition-colors",
              mealType === t.value ? "border-nutrition bg-nutrition-soft text-nutrition" : "border-border text-ink-soft"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border-soft p-4 text-center">
        <div className="font-display text-2xl font-bold text-ink">≈ {totals.calories} kcal</div>
        <div className="mt-1 flex justify-center gap-3 text-xs text-ink-soft">
          <span>{totals.protein} g P</span>
          <span>{totals.carbs} g C</span>
          <span>{totals.fat} g G</span>
          <span>{totals.fiber} g fibra</span>
        </div>
        <p className="mt-2 text-[11px] text-ink-faint">
          Estimación de la IA{photoDataUrl ? " a partir de la foto" : ""}. Puede tener errores — revisá las cantidades.
        </p>
      </div>

      <div className="space-y-2">
        {foods.map((food) => (
          <FoodRow key={food.clientId} food={food} onChange={(patch) => updateFood(food.clientId, patch)} onRemove={() => removeFood(food.clientId)} />
        ))}
      </div>

      <AddFoodSearch onAdd={addFood} />

      {error && <p className="text-center text-sm text-danger">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={onRestart} className="flex-1 rounded-xl border border-border px-4 py-3 font-display text-sm font-medium text-ink">
          Sacar otra foto
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSaving || foods.length === 0}
          className="flex-1 rounded-xl bg-nutrition px-4 py-3 font-display text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60"
        >
          {isSaving ? "Guardando..." : "Confirmar comida"}
        </button>
      </div>
    </div>
  );
}

function FoodRow({
  food,
  onChange,
  onRemove,
}: {
  food: DraftMealFood;
  onChange: (patch: Partial<DraftMealFood>) => void;
  onRemove: () => void;
}) {
  const totals = computeFoodTotals(food);
  const isAiDetected = food.aiConfidence != null;
  const conf = confidenceLabel(food.foodItemId ? food.aiConfidence : null);

  return (
    <div className="rounded-xl border border-border-soft p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{food.displayName}</p>
          {food.preparationMethod && <p className="text-xs text-ink-faint">{food.preparationMethod}</p>}
          {isAiDetected ? (
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${conf.className}`}>{conf.label}</span>
          ) : (
            <span className="mt-1 inline-block rounded-full bg-surface-raised px-2 py-0.5 text-[11px] font-medium text-ink-faint">
              Agregado manualmente
            </span>
          )}
        </div>
        <button type="button" onClick={onRemove} className="shrink-0 text-xs text-ink-faint hover:text-danger">
          Eliminar
        </button>
      </div>

      {!food.foodItemId && (
        <p className="mt-2 text-xs text-danger">No encontramos este alimento en la base. Buscá uno abajo para reemplazarlo.</p>
      )}

      <div className="mt-2 flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-ink-soft">
          Cantidad
          <input
            type="number"
            min={0}
            value={food.estimatedGrams}
            onChange={(e) => onChange({ estimatedGrams: Number(e.target.value) || 0 })}
            className="w-20 rounded-lg border border-border bg-surface px-2 py-1 text-sm text-ink"
          />
          g
        </label>
        <div className="flex gap-3 text-xs text-ink-soft">
          <span>{totals.calories} kcal</span>
          <span>{totals.protein} g P</span>
          <span>{totals.carbs} g C</span>
          <span>{totals.fat} g G</span>
        </div>
      </div>
    </div>
  );
}

function AddFoodSearch({ onAdd }: { onAdd: (food: FoodItem) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [isSearching, startSearch] = useTransition();

  function handleChange(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    startSearch(async () => {
      const found = await searchFoodsAction(value);
      setResults(found);
    });
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="+ Agregar otro alimento"
        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-ink"
      />
      {isSearching && <p className="text-xs text-ink-faint">Buscando...</p>}
      {results.length > 0 && (
        <div className="space-y-1">
          {results.slice(0, 6).map((food) => (
            <button
              key={food.id}
              type="button"
              onClick={() => {
                onAdd(food);
                setQuery("");
                setResults([]);
              }}
              className="block w-full rounded-lg border border-border px-3 py-2 text-left text-sm text-ink hover:bg-surface-raised"
            >
              {food.name} <span className="text-xs text-ink-faint">· {Math.round(food.caloriesPer100g)} kcal/100g</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
