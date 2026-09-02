"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { GoalDomain, GoalMetric, MeasurementType } from "@/generated/prisma/client";
import type { Dictionary } from "@/lib/i18n";
import { createGoal } from "./actions";

export function NewGoalForm({
  accounts,
  exercises,
  t,
}: {
  accounts: { id: string; name: string }[];
  exercises: { id: string; name: string }[];
  t: Dictionary;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState<GoalDomain>("FINANCE");
  const [metric, setMetric] = useState<GoalMetric>("SAVINGS");
  const [label, setLabel] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [exerciseId, setExerciseId] = useState(exercises[0]?.id ?? "");
  const [measurementType, setMeasurementType] = useState<MeasurementType>("WAIST");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const domainOptions: { value: GoalDomain; label: string }[] = [
    { value: "FINANCE", label: t.goals.domainFinance },
    { value: "NUTRITION", label: t.goals.domainNutrition },
    { value: "FITNESS", label: t.goals.domainFitness },
    { value: "BODY", label: t.goals.domainBody },
  ];

  const metricsByDomain: Record<GoalDomain, { value: GoalMetric; label: string }[]> = {
    FINANCE: [{ value: "SAVINGS", label: t.goals.metricSavings }],
    NUTRITION: [
      { value: "CALORIE_ADHERENCE", label: t.goals.metricCalorieAdherence },
      { value: "PROTEIN_TARGET_STREAK", label: t.goals.metricProteinStreak },
    ],
    FITNESS: [
      { value: "EXERCISE_WEIGHT", label: t.goals.metricExerciseWeight },
      { value: "WORKOUT_FREQUENCY", label: t.goals.metricWorkoutFrequency },
    ],
    BODY: [{ value: "BODY_MEASUREMENT", label: t.goals.metricBodyMeasurement }],
  };

  const measurementTypeOptions: { value: MeasurementType; label: string }[] = [
    { value: "WAIST", label: t.measurementTypes.WAIST },
    { value: "CHEST", label: t.measurementTypes.CHEST },
    { value: "ARM", label: t.measurementTypes.ARM },
    { value: "LEG", label: t.measurementTypes.LEG },
    { value: "HIP", label: t.measurementTypes.HIP },
    { value: "NECK", label: t.measurementTypes.NECK },
    { value: "CUSTOM", label: t.measurementTypes.CUSTOM },
  ];

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-xl bg-accent px-4 py-2.5 font-display text-sm font-medium text-white hover:opacity-90">
        {t.goals.newGoal}
      </button>
    );
  }

  function handleDomainChange(d: GoalDomain) {
    setDomain(d);
    setMetric(metricsByDomain[d][0].value);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createGoal({
          domain,
          metric,
          label,
          targetValue: Number(targetValue),
          targetDate: targetDate || undefined,
          accountId: metric === "SAVINGS" ? accountId : undefined,
          exerciseId: metric === "EXERCISE_WEIGHT" ? exerciseId : undefined,
          measurementType: metric === "BODY_MEASUREMENT" ? measurementType : undefined,
        });
        setLabel("");
        setTargetValue("");
        setTargetDate("");
        setOpen(false);
        router.refresh();
      } catch {
        setError(t.goals.validationError);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-border-soft bg-surface p-4">
      <p className="font-display text-sm font-medium text-ink">{t.goals.newGoalTitle}</p>

      <div className="grid grid-cols-2 gap-2">
        <select value={domain} onChange={(e) => handleDomainChange(e.target.value as GoalDomain)} className="h-10 rounded-lg border border-border bg-surface px-2 text-sm text-ink">
          {domainOptions.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
        <select value={metric} onChange={(e) => setMetric(e.target.value as GoalMetric)} className="h-10 rounded-lg border border-border bg-surface px-2 text-sm text-ink">
          {metricsByDomain[domain].map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {metric === "SAVINGS" && (
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-surface px-2 text-sm text-ink">
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      )}
      {metric === "EXERCISE_WEIGHT" && (
        <select value={exerciseId} onChange={(e) => setExerciseId(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-surface px-2 text-sm text-ink">
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
      )}
      {metric === "BODY_MEASUREMENT" && (
        <select value={measurementType} onChange={(e) => setMeasurementType(e.target.value as MeasurementType)} className="h-10 w-full rounded-lg border border-border bg-surface px-2 text-sm text-ink">
          {measurementTypeOptions.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      )}

      <input
        type="text"
        required
        placeholder={t.goals.labelPlaceholder}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-ink"
      />

      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          required
          placeholder={t.goals.targetPlaceholder}
          value={targetValue}
          onChange={(e) => setTargetValue(e.target.value)}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-ink"
        />
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-ink"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-xl bg-accent px-4 py-2 font-display text-sm font-medium text-white disabled:opacity-60">
          {isPending ? t.goals.creating : t.goals.createGoal}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2 font-display text-sm font-medium text-ink-soft hover:bg-surface-raised">
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}
