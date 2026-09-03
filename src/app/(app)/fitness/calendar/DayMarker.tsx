"use client";

import { useTransition } from "react";
import type { Dictionary } from "@/lib/i18n";
import { markWorkoutDone, unmarkWorkoutDone } from "../workout/actions";

export function DayMarker({
  workoutDayId,
  date,
  sessionId,
  isCompleted,
  canUndo,
  t,
}: {
  workoutDayId: string;
  date: string;
  sessionId: string | null;
  isCompleted: boolean;
  canUndo: boolean;
  t: Dictionary;
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
        {t.fitness.calendar.undo}
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
      {t.fitness.calendar.markDone}
    </button>
  );
}
