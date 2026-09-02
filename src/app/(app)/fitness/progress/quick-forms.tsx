"use client";

import { useState, useTransition } from "react";
import type { MeasurementType } from "@/generated/prisma/client";
import { logMeasurement, logWeight } from "./actions";

export function QuickAddWeight() {
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-fitness underline underline-offset-2">
        Registrar peso
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
        Guardar
      </button>
    </form>
  );
}

const MEASUREMENT_TYPES: { value: MeasurementType; label: string }[] = [
  { value: "WAIST", label: "Cintura" },
  { value: "CHEST", label: "Pecho" },
  { value: "ARM", label: "Brazo" },
  { value: "LEG", label: "Pierna" },
  { value: "HIP", label: "Cadera" },
  { value: "NECK", label: "Cuello" },
  { value: "CUSTOM", label: "Personalizado" },
];

export function QuickAddMeasurement() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<MeasurementType>("WAIST");
  const [customLabel, setCustomLabel] = useState("");
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-fitness underline underline-offset-2">
        Registrar medida
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
        {MEASUREMENT_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      {type === "CUSTOM" && (
        <input
          type="text"
          placeholder="Etiqueta"
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
        Guardar
      </button>
    </form>
  );
}
