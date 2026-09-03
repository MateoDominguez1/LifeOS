"use client";

import { useState, useTransition } from "react";
import type { RirRpeMode } from "@/generated/prisma/client";
import type { WeightSuggestion } from "@/lib/fitness/types";
import { Card } from "@/components/ui/card";
import type { Dictionary } from "@/lib/i18n";
import { logSet, finishWorkoutSession } from "../actions";

export interface ExerciseCardData {
  workoutExerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetRir: number | null;
  targetRpe: number | null;
  restSeconds: number;
  suggestion: WeightSuggestion;
  existingSets: { setNumber: number; weightKg: number; reps: number; rir: number | null; rpe: number | null; completed: boolean }[];
}

interface SetRow {
  weight: string;
  reps: string;
  rir: string;
  completed: boolean;
  saving?: boolean;
  error?: string;
}

function buildInitialRows(ex: ExerciseCardData): SetRow[] {
  return Array.from({ length: ex.targetSets }, (_, i) => {
    const setNumber = i + 1;
    const existing = ex.existingSets.find((s) => s.setNumber === setNumber);
    if (existing) {
      return {
        weight: String(existing.weightKg),
        reps: String(existing.reps),
        rir: existing.rir != null ? String(existing.rir) : existing.rpe != null ? String(existing.rpe) : "",
        completed: existing.completed,
      };
    }
    return {
      weight: ex.suggestion.suggestedWeightKg != null ? String(ex.suggestion.suggestedWeightKg) : "",
      reps: String(ex.targetRepsMin),
      rir: ex.targetRir != null ? String(ex.targetRir) : "",
      completed: false,
    };
  });
}

export function WorkoutSessionClient({
  sessionId,
  dayLabel,
  rirRpeMode,
  exercises,
  t,
}: {
  sessionId: string;
  dayLabel: string;
  rirRpeMode: RirRpeMode;
  exercises: ExerciseCardData[];
  t: Dictionary;
}) {
  const [rows, setRows] = useState<Record<string, SetRow[]>>(() =>
    Object.fromEntries(exercises.map((ex) => [ex.workoutExerciseId, buildInitialRows(ex)]))
  );
  const [isFinishing, startFinishing] = useTransition();

  const totalSets = exercises.reduce((sum, ex) => sum + ex.targetSets, 0);
  const completedSets = Object.values(rows).reduce((sum, r) => sum + r.filter((row) => row.completed).length, 0);

  function updateRow(workoutExerciseId: string, index: number, patch: Partial<SetRow>) {
    setRows((prev) => ({
      ...prev,
      [workoutExerciseId]: prev[workoutExerciseId].map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  }

  function completeSet(workoutExerciseId: string, index: number) {
    const row = rows[workoutExerciseId][index];
    const weightKg = Number(row.weight);
    const reps = Number(row.reps);
    if (row.weight === "" || row.reps === "" || Number.isNaN(weightKg) || !reps) return;

    updateRow(workoutExerciseId, index, { saving: true, error: undefined });

    const rirValue = row.rir ? Number(row.rir) : undefined;

    startFinishing(async () => {
      try {
        await logSet({
          sessionId,
          workoutExerciseId,
          setNumber: index + 1,
          weightKg,
          reps,
          rir: rirRpeMode === "RIR" ? rirValue : undefined,
          rpe: rirRpeMode === "RPE" ? rirValue : undefined,
        });
        updateRow(workoutExerciseId, index, { completed: true, saving: false });
      } catch {
        updateRow(workoutExerciseId, index, { saving: false, error: t.fitness.workout.saveError });
      }
    });
  }

  function handleFinish() {
    startFinishing(async () => {
      await finishWorkoutSession(sessionId);
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-24">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-ink">{dayLabel}</h1>
        <span className="font-mono text-sm text-ink-soft">
          {completedSets}/{totalSets} {t.fitness.workout.setsUnit}
        </span>
      </header>

      {exercises.map((ex) => (
        <Card key={ex.workoutExerciseId}>
          <h2 className="font-display text-base font-semibold text-ink">{ex.exerciseName}</h2>
          <p className="text-xs text-ink-faint">
            {t.fitness.workout.targetLabel} {ex.targetRepsMin}-{ex.targetRepsMax} {t.fitness.workout.repsUnit}
            {rirRpeMode === "RIR" && ex.targetRir != null && ` @ RIR ${ex.targetRir}`}
            {rirRpeMode === "RPE" && ex.targetRpe != null && ` @ RPE ${ex.targetRpe}`}
            {` · ${t.fitness.workout.restLabelInline} ${ex.restSeconds}s`}
          </p>
          {ex.suggestion.reason && <p className="mt-1 text-xs text-fitness">💡 {ex.suggestion.reason}</p>}

          <div className="mt-3 space-y-2">
            {rows[ex.workoutExerciseId].map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-xs text-ink-faint">{t.fitness.workout.setLabel} {i + 1}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="kg"
                  value={row.weight}
                  disabled={row.completed}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => updateRow(ex.workoutExerciseId, i, { weight: e.target.value })}
                  className="w-16 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-ink disabled:opacity-60"
                />
                <span className="text-ink-faint">×</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={t.fitness.workout.repsUnit}
                  value={row.reps}
                  disabled={row.completed}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => updateRow(ex.workoutExerciseId, i, { reps: e.target.value })}
                  className="w-16 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-ink disabled:opacity-60"
                />
                {rirRpeMode !== "NONE" && (
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder={rirRpeMode}
                    value={row.rir}
                    disabled={row.completed}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => updateRow(ex.workoutExerciseId, i, { rir: e.target.value })}
                    className="w-14 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-ink disabled:opacity-60"
                  />
                )}
                <button
                  type="button"
                  disabled={row.completed || row.saving}
                  onClick={() => completeSet(ex.workoutExerciseId, i)}
                  className={`ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                    row.completed ? "bg-money-soft text-money" : "border border-border text-ink-soft hover:bg-surface-raised"
                  }`}
                >
                  {row.saving ? "…" : "✓"}
                </button>
              </div>
            ))}
            {rows[ex.workoutExerciseId].some((r) => r.error) && <p className="text-xs text-danger">{t.fitness.workout.saveError}</p>}
          </div>
        </Card>
      ))}

      <button
        type="button"
        onClick={handleFinish}
        disabled={isFinishing}
        className="fixed bottom-4 left-1/2 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-xl bg-fitness px-4 py-3 font-display text-sm font-medium text-white shadow-lg hover:opacity-90 disabled:opacity-60"
      >
        {isFinishing ? t.common.saving : t.fitness.workout.finishSubmit}
      </button>
    </div>
  );
}
