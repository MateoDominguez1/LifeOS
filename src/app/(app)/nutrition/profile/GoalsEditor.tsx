"use client";

import { useState, useTransition } from "react";
import { Field, TextInput, ToggleRow } from "@/components/nutrition/form";
import { setManualOverride, updateGoals, type UpdateGoalsInput } from "./actions";

export function GoalsEditor({
  initial,
  isManualOverride,
}: {
  initial: UpdateGoalsInput;
  isManualOverride: boolean;
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
        setError("Revisá los valores: tienen que ser números válidos y no negativos.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <ToggleRow label="Personalizar objetivos manualmente" checked={manual} onChange={toggleManual} />

      {manual && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Calorías (kcal)">
              <TextInput type="number" value={goals.calories} onChange={(e) => setGoals({ ...goals, calories: Number(e.target.value) })} />
            </Field>
            <Field label="Proteína (g)">
              <TextInput type="number" value={goals.protein} onChange={(e) => setGoals({ ...goals, protein: Number(e.target.value) })} />
            </Field>
            <Field label="Carbohidratos (g)">
              <TextInput type="number" value={goals.carbs} onChange={(e) => setGoals({ ...goals, carbs: Number(e.target.value) })} />
            </Field>
            <Field label="Grasas (g)">
              <TextInput type="number" value={goals.fat} onChange={(e) => setGoals({ ...goals, fat: Number(e.target.value) })} />
            </Field>
            <Field label="Fibra (g)">
              <TextInput type="number" value={goals.fiber} onChange={(e) => setGoals({ ...goals, fiber: Number(e.target.value) })} />
            </Field>
            <Field label="Agua (L)">
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
              {isPending ? "Guardando..." : "Guardar objetivos"}
            </button>
            {saved && <span className="text-sm text-money">Guardado ✓</span>}
          </div>
        </form>
      )}
    </div>
  );
}
