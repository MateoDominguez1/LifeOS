"use client";

import { useState, useTransition } from "react";
import type { Dictionary } from "@/lib/i18n";
import { addExercise } from "./actions";

export function AddExerciseForm({
  workoutDayId,
  options,
  t,
}: {
  workoutDayId: string;
  options: { id: string; name: string }[];
  t: Dictionary;
}) {
  const [selected, setSelected] = useState(options[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  if (options.length === 0) return null;

  return (
    <div className="mt-3 flex gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="h-9 flex-1 rounded-lg border border-border bg-surface px-2 text-sm text-ink"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => addExercise(workoutDayId, selected))}
        className="rounded-lg bg-fitness px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {t.common.add}
      </button>
    </div>
  );
}
