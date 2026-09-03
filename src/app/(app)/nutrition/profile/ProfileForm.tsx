"use client";

import { useState, useTransition } from "react";
import { Field, OptionCard, TextInput } from "@/components/nutrition/form";
import type { ActivityLevel, GoalType, Sex } from "@/lib/nutrition/types";
import type { Dictionary } from "@/lib/i18n";
import { updateProfile } from "./actions";

export interface ProfileFormData {
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  weightGoalKg: number | null;
  activityLevel: ActivityLevel;
  goalType: GoalType;
}

export function ProfileForm({ initial, t }: { initial: ProfileFormData; t: Dictionary }) {
  const [data, setData] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SEX_OPTIONS: { value: Sex; label: string }[] = [
    { value: "MALE", label: t.nutrition.common.sexMale },
    { value: "FEMALE", label: t.nutrition.common.sexFemale },
    { value: "OTHER", label: t.nutrition.common.sexOther },
  ];

  const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
    { value: "SEDENTARY", label: t.nutrition.common.activitySedentary },
    { value: "LIGHT", label: t.nutrition.common.activityLight },
    { value: "MODERATE", label: t.nutrition.common.activityModerate },
    { value: "ACTIVE", label: t.nutrition.common.activityActive },
    { value: "VERY_ACTIVE", label: t.nutrition.common.activityVeryActive },
  ];

  const GOAL_OPTIONS: { value: GoalType; label: string }[] = [
    { value: "LOSE_FAT", label: t.nutrition.profile.goalLoseFat },
    { value: "GAIN_MUSCLE", label: t.nutrition.profile.goalGainMuscle },
    { value: "MAINTAIN", label: t.nutrition.profile.goalMaintain },
    { value: "RECOMPOSITION", label: t.nutrition.profile.goalRecomposition },
    { value: "IMPROVE_DIET", label: t.nutrition.profile.goalImproveDiet },
    { value: "OTHER", label: t.nutrition.profile.goalOther },
  ];

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
        setError(t.nutrition.profile.profileSaveError);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.nutrition.common.ageLabel}>
          <TextInput type="number" value={data.age} onChange={(e) => update({ age: Number(e.target.value) })} />
        </Field>
        <Field label={t.nutrition.common.heightLabel}>
          <TextInput type="number" value={data.heightCm} onChange={(e) => update({ heightCm: Number(e.target.value) })} />
        </Field>
        <Field label={t.nutrition.common.currentWeightLabel}>
          <TextInput type="number" step={0.1} value={data.weightKg} onChange={(e) => update({ weightKg: Number(e.target.value) })} />
        </Field>
        <Field label={t.nutrition.profile.weightGoalLabel}>
          <TextInput
            type="number"
            step={0.1}
            value={data.weightGoalKg ?? ""}
            onChange={(e) => update({ weightGoalKg: e.target.value ? Number(e.target.value) : null })}
          />
        </Field>
      </div>

      <Field label={t.nutrition.common.sexLabel}>
        <div className="grid grid-cols-3 gap-2">
          {SEX_OPTIONS.map((opt) => (
            <OptionCard key={opt.value} value={opt.value} currentValue={data.sex} label={opt.label} onSelect={(sex) => update({ sex })} />
          ))}
        </div>
      </Field>

      <Field label={t.nutrition.profile.activityLabel}>
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

      <Field label={t.nutrition.profile.goalLabel}>
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
          {isPending ? t.common.saving : t.nutrition.profile.saveChangesButton}
        </button>
        {saved && <span className="text-sm text-money">{t.common.saved}</span>}
      </div>
    </form>
  );
}
