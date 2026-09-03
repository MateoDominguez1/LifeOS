"use client";

import { useState, useTransition } from "react";
import type { Dictionary } from "@/lib/i18n";
import { logWeight } from "./actions";

export function WeightForm({ initialWeight, t }: { initialWeight: number | null; t: Dictionary }) {
  const [weight, setWeight] = useState(initialWeight?.toString() ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = Number(weight);
    if (!value) return;
    startTransition(async () => {
      try {
        await logWeight(value);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        setError(t.nutrition.progress.invalidWeight);
      }
    });
  }

  return (
    <div className="space-y-1">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="number"
          step={0.1}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder={t.nutrition.progress.weightPlaceholder}
          className="w-28 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-nutrition px-3 py-2 font-display text-sm font-medium text-white disabled:opacity-60"
        >
          {isPending ? t.common.saving : t.nutrition.progress.register}
        </button>
        {saved && <span className="text-xs text-money">✓</span>}
      </form>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
