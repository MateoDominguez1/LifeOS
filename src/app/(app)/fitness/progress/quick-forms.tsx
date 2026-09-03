"use client";

import { useState, useTransition } from "react";
import type { MeasurementType } from "@/generated/prisma/client";
import type { Dictionary } from "@/lib/i18n";
import { logMeasurement, logWeight } from "./actions";

export function QuickAddWeight({ t }: { t: Dictionary }) {
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-fitness underline underline-offset-2">
        {t.fitness.progress.registerWeight}
      </button>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const weightKg = Number(weight);
    if (!weightKg) return;
    startTransition(async () => {
      await logWeight({ weightKg });
      setWeight("");
      setOpen(false);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="number"
        inputMode="decimal"
        autoFocus
        placeholder="kg"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        className="w-20 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-ink"
      />
      <button type="submit" disabled={isPending} className="rounded-lg bg-fitness px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60">
        {t.common.save}
      </button>
    </form>
  );
}

export function QuickAddMeasurement({ t }: { t: Dictionary }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<MeasurementType>("WAIST");
  const [customLabel, setCustomLabel] = useState("");
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();

  const MEASUREMENT_TYPES: { value: MeasurementType; label: string }[] = [
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
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-fitness underline underline-offset-2">
        {t.fitness.progress.registerMeasurement}
      </button>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valueCm = Number(value);
    if (!valueCm) return;
    startTransition(async () => {
      await logMeasurement({ type, customLabel: customLabel || undefined, valueCm });
      setValue("");
      setOpen(false);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <select
        value={type}
        onChange={(e) => setType(e.target.value as MeasurementType)}
        className="h-9 rounded-lg border border-border bg-surface px-2 text-sm text-ink"
      >
        {MEASUREMENT_TYPES.map((mt) => (
          <option key={mt.value} value={mt.value}>
            {mt.label}
          </option>
        ))}
      </select>
      {type === "CUSTOM" && (
        <input
          type="text"
          placeholder={t.fitness.progress.labelPlaceholder}
          value={customLabel}
          onChange={(e) => setCustomLabel(e.target.value)}
          className="w-24 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-ink"
        />
      )}
      <input
        type="number"
        inputMode="decimal"
        autoFocus
        placeholder="cm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-16 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-ink"
      />
      <button type="submit" disabled={isPending} className="rounded-lg bg-fitness px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60">
        {t.common.save}
      </button>
    </form>
  );
}
