"use client";

import { useState, useTransition } from "react";
import { Field, OptionCard, TextInput } from "@/components/nutrition/form";
import type { ActivityLevel, GoalType, Sex } from "@/lib/nutrition/types";
import { updateProfile } from "./actions";

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: "MALE", label: "Masculino" },
  { value: "FEMALE", label: "Femenino" },
  { value: "OTHER", label: "Otro" },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: "SEDENTARY", label: "Sedentario" },
  { value: "LIGHT", label: "Ligero" },
  { value: "MODERATE", label: "Moderado" },
  { value: "ACTIVE", label: "Activo" },
  { value: "VERY_ACTIVE", label: "Muy activo" },
];

const GOAL_OPTIONS: { value: GoalType; label: string }[] = [
  { value: "LOSE_FAT", label: "Perder grasa" },
  { value: "GAIN_MUSCLE", label: "Ganar músculo" },
  { value: "MAINTAIN", label: "Mantener" },
  { value: "RECOMPOSITION", label: "Recomposición" },
  { value: "IMPROVE_DIET", label: "Mejorar alimentación" },
  { value: "OTHER", label: "Otro" },
];

export interface ProfileFormData {
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  weightGoalKg: number | null;
  activityLevel: ActivityLevel;
  goalType: GoalType;
}

export function ProfileForm({ initial }: { initial: ProfileFormData }) {
  const [data, setData] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(patch: Partial<ProfileFormData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await updateProfile(data);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        setError("Revisá los datos ingresados (rangos de edad, altura y peso).");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Edad">
          <TextInput type="number" value={data.age} onChange={(e) => update({ age: Number(e.target.value) })} />
        </Field>
        <Field label="Altura (cm)">
          <TextInput type="number" value={data.heightCm} onChange={(e) => update({ heightCm: Number(e.target.value) })} />
        </Field>
        <Field label="Peso actual (kg)">
          <TextInput type="number" step={0.1} value={data.weightKg} onChange={(e) => update({ weightKg: Number(e.target.value) })} />
        </Field>
        <Field label="Peso objetivo (kg)">
          <TextInput
            type="number"
            step={0.1}
            value={data.weightGoalKg ?? ""}
            onChange={(e) => update({ weightGoalKg: e.target.value ? Number(e.target.value) : null })}
          />
        </Field>
      </div>

      <Field label="Sexo">
        <div className="grid grid-cols-3 gap-2">
          {SEX_OPTIONS.map((opt) => (
            <OptionCard key={opt.value} value={opt.value} currentValue={data.sex} label={opt.label} onSelect={(sex) => update({ sex })} />
          ))}
        </div>
      </Field>

      <Field label="Actividad">
        <div className="grid grid-cols-3 gap-2">
          {ACTIVITY_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              value={opt.value}
              currentValue={data.activityLevel}
              label={opt.label}
              onSelect={(activityLevel) => update({ activityLevel })}
            />
          ))}
        </div>
      </Field>

      <Field label="Objetivo">
        <div className="grid grid-cols-2 gap-2">
          {GOAL_OPTIONS.map((opt) => (
            <OptionCard key={opt.value} value={opt.value} currentValue={data.goalType} label={opt.label} onSelect={(goalType) => update({ goalType })} />
          ))}
        </div>
      </Field>

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-nutrition px-4 py-2.5 font-display text-sm font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
        {saved && <span className="text-sm text-money">Guardado ✓</span>}
      </div>
    </form>
  );
}
