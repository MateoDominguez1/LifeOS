"use client";

import { useState, useTransition } from "react";
import type { Dictionary } from "@/lib/i18n";
import { addWorkoutDay } from "./actions";

export function AddDayForm({
  programId,
  usedWeekdays,
  weekdayLabels,
  t,
}: {
  programId: string;
  usedWeekdays: number[];
  weekdayLabels: string[];
  t: Dictionary;
}) {
  const options = weekdayLabels.map((label, value) => ({ value, label })).filter((o) => !usedWeekdays.includes(o.value));
  const [selected, setSelected] = useState(options[0]?.value ?? -1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (options.length === 0) return null;

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      try {
        await addWorkoutDay(programId, selected);
      } catch (e) {
        setError(e instanceof Error ? e.message : t.fitness.programs.addDayError);
      }
    });
  }

  return (
    <div className="rounded-xl border border-dashed border-border p-3">
      <div className="flex gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(Number(e.target.value))}
          className="h-9 flex-1 rounded-lg border border-border bg-surface px-2 text-sm text-ink"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={isPending}
          onClick={handleAdd}
          className="rounded-lg bg-fitness px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {t.fitness.programs.addDay}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
