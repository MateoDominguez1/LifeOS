"use client";

import { useState, useTransition } from "react";
import { Field, TextInput, ToggleRow } from "@/components/nutrition/form";
import type { Dictionary } from "@/lib/i18n";
import { setManualOverride, updateGoals, type UpdateGoalsInput } from "./actions";

export function GoalsEditor({
  initial,
  isManualOverride,
  t,
}: {
  initial: UpdateGoalsInput;
  isManualOverride: boolean;
  t: Dictionary;
}) {
  const [goals, setGoals] = useState(initial);
  const [manual, setManual] = useState(isManualOverride);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleManual(value: boolean) {
    setManual(value);
    startTransition(async () => {
      try {
        await setManualOverride(value);
      } catch {
        setManual(!value);
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await updateGoals(goals);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        setError(t.nutrition.profile.goalsSaveError);
      }
    });
  }

  return (
    <div className="space-y-4">
      <ToggleRow label={t.nutrition.profile.manualGoalsToggle} checked={manual} onChange={toggleManual} />

      {manual && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.nutrition.common.caloriesLabel}>
              <TextInput type="number" value={goals.calories} onChange={(e) => setGoals({ ...goals, calories: Number(e.target.value) })} />
            </Field>
            <Field label={t.nutrition.common.proteinLabel}>
              <TextInput type="number" value={goals.protein} onChange={(e) => setGoals({ ...goals, protein: Number(e.target.value) })} />
            </Field>
            <Field label={t.nutrition.common.carbsLabel}>
              <TextInput type="number" value={goals.carbs} onChange={(e) => setGoals({ ...goals, carbs: Number(e.target.value) })} />
            </Field>
            <Field label={t.nutrition.common.fatLabel}>
              <TextInput type="number" value={goals.fat} onChange={(e) => setGoals({ ...goals, fat: Number(e.target.value) })} />
            </Field>
            <Field label={t.nutrition.common.fiberLabel}>
              <TextInput type="number" value={goals.fiber} onChange={(e) => setGoals({ ...goals, fiber: Number(e.target.value) })} />
            </Field>
            <Field label={t.nutrition.common.waterLabel}>
              <TextInput type="number" step={0.1} value={goals.water} onChange={(e) => setGoals({ ...goals, water: Number(e.target.value) })} />
            </Field>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-nutrition px-4 py-2.5 font-display text-sm font-medium text-white disabled:opacity-60"
            >
              {isPending ? t.common.saving : t.nutrition.profile.saveGoalsButton}
            </button>
            {saved && <span className="text-sm text-money">{t.common.saved}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
