"use client";

import { useState, useTransition } from "react";
import { moveExercise, removeExercise, updateExerciseTargets } from "./actions";

export interface ExerciseRowData {
  id: string;
  workoutDayId: string;
  name: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  restSeconds: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export function ExerciseRow({ data }: { data: ExerciseRowData }) {
  const [sets, setSets] = useState(data.targetSets);
  const [repsMin, setRepsMin] = useState(data.targetRepsMin);
  const [repsMax, setRepsMax] = useState(data.targetRepsMax);
  const [rest, setRest] = useState(data.restSeconds);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await updateExerciseTargets(data.id, { targetSets: sets, targetRepsMin: repsMin, targetRepsMax: repsMax, restSeconds: rest });
    });
  }

  return (
    <div className="rounded-xl border border-border-soft p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-ink">{data.name}</span>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            disabled={!data.canMoveUp || isPending}
            onClick={() => startTransition(() => moveExercise(data.workoutDayId, data.id, "up"))}
            className="rounded px-1.5 py-0.5 text-xs text-ink-faint hover:bg-surface-raised disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={!data.canMoveDown || isPending}
            onClick={() => startTransition(() => moveExercise(data.workoutDayId, data.id, "down"))}
            className="rounded px-1.5 py-0.5 text-xs text-ink-faint hover:bg-surface-raised disabled:opacity-30"
          >
            ↓
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => removeExercise(data.id))}
            className="rounded px-1.5 py-0.5 text-xs text-danger hover:bg-danger-soft"
          >
            Quitar
          </button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-soft">
        <label className="flex items-center gap-1">
          Sets
          <input
            type="number"
            value={sets}
            onChange={(e) => setSets(Number(e.target.value))}
            onBlur={save}
            className="w-12 rounded-lg border border-border bg-surface px-1.5 py-1 text-ink"
          />
        </label>
        <label className="flex items-center gap-1">
          Reps
          <input
            type="number"
            value={repsMin}
            onChange={(e) => setRepsMin(Number(e.target.value))}
            onBlur={save}
            className="w-12 rounded-lg border border-border bg-surface px-1.5 py-1 text-ink"
          />
          -
          <input
            type="number"
            value={repsMax}
            onChange={(e) => setRepsMax(Number(e.target.value))}
            onBlur={save}
            className="w-12 rounded-lg border border-border bg-surface px-1.5 py-1 text-ink"
          />
        </label>
        <label className="flex items-center gap-1">
          Descanso (s)
          <input
            type="number"
            value={rest}
            onChange={(e) => setRest(Number(e.target.value))}
            onBlur={save}
            className="w-16 rounded-lg border border-border bg-surface px-1.5 py-1 text-ink"
          />
        </label>
      </div>
    </div>
  );
}
