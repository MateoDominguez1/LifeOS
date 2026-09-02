"use client";

import { useTransition } from "react";
import { markWorkoutDone, unmarkWorkoutDone } from "../workout/actions";

export function DayMarker({
  workoutDayId,
  date,
  sessionId,
  isCompleted,
  canUndo,
}: {
  workoutDayId: string;
  date: string;
  sessionId: string | null;
  isCompleted: boolean;
  canUndo: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  if (isCompleted) {
    if (!canUndo) return null;
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => unmarkWorkoutDone(sessionId!))}
        className="rounded-lg px-2 py-1 text-xs font-medium text-ink-faint hover:bg-surface-raised disabled:opacity-50"
      >
        Deshacer
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => markWorkoutDone(workoutDayId, date))}
      className="rounded-lg bg-fitness-soft px-2 py-1 text-xs font-medium text-fitness hover:opacity-80 disabled:opacity-50"
    >
      ✓ Lo hice
    </button>
  );
}
