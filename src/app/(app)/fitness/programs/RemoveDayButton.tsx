"use client";

import { useState, useTransition } from "react";
import type { Dictionary } from "@/lib/i18n";
import { removeWorkoutDay } from "./actions";

export function RemoveDayButton({ workoutDayId, disabled, t }: { workoutDayId: string; disabled: boolean; t: Dictionary }) {
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      try {
        await removeWorkoutDay(workoutDayId);
      } catch (e) {
        setError(e instanceof Error ? e.message : t.fitness.programs.removeDayError);
        setConfirming(false);
      }
    });
  }

  if (disabled) return null;

  return (
    <div className="shrink-0 text-right">
      {confirming ? (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={isPending}
            onClick={handleRemove}
            className="rounded-lg bg-danger px-2 py-1 text-xs font-medium text-white disabled:opacity-60"
          >
            {t.common.confirm}
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="text-xs text-ink-faint">
            {t.common.cancel}
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className="text-xs text-ink-faint hover:text-danger">
          {t.fitness.programs.removeDay}
        </button>
      )}
      {error && <p className="mt-1 max-w-[160px] text-[11px] text-danger">{error}</p>}
    </div>
  );
}
