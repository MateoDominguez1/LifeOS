"use client";

import { useState, useTransition } from "react";
import { removeWorkoutDay } from "./actions";

export function RemoveDayButton({ workoutDayId, disabled }: { workoutDayId: string; disabled: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      try {
        await removeWorkoutDay(workoutDayId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No pudimos borrar el día.");
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
            Confirmar
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="text-xs text-ink-faint">
            Cancelar
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className="text-xs text-ink-faint hover:text-danger">
          Borrar día
        </button>
      )}
      {error && <p className="mt-1 max-w-[160px] text-[11px] text-danger">{error}</p>}
    </div>
  );
}
