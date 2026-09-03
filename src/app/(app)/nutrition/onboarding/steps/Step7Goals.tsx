import { useMemo } from "react";
import { calculateNutritionGoals } from "@/lib/nutrition/calculations";
import type { OnboardingData } from "../types";
import { Field, StepShell, TextInput, ToggleRow } from "@/components/nutrition/form";
import type { Dictionary } from "@/lib/i18n";

export function Step7Goals({
  data,
  update,
  t,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  t: Dictionary["nutrition"];
}) {
  const computed = useMemo(() => {
    if (!data.sex || !data.age || !data.heightCm || !data.weightKg || !data.activityLevel || !data.goalType) {
      return null;
    }
    return calculateNutritionGoals({
      sex: data.sex,
      age: data.age,
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      activityLevel: data.activityLevel,
      goalType: data.goalType,
      goalRateKgPerWeek: data.goalRateKgPerWeek ?? undefined,
    });
  }, [data.sex, data.age, data.heightCm, data.weightKg, data.activityLevel, data.goalType, data.goalRateKgPerWeek]);

  if (!computed) {
    return (
      <StepShell title={t.onboarding.step7Title}>
        <p className="text-sm text-ink-soft">{t.onboarding.step7Incomplete}</p>
      </StepShell>
    );
  }

  return (
    <StepShell title={t.onboarding.step7Title} subtitle={t.onboarding.step7Subtitle}>
      <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border-soft p-4">
        <Stat label={t.onboarding.statCaloriesLabel} value={`${data.manualCalories ?? computed.calories}`} unit="kcal" />
        <Stat label={t.onboarding.statProteinLabel} value={`${data.manualProtein ?? computed.protein}`} unit="g" />
        <Stat label={t.onboarding.statCarbsLabel} value={`${data.manualCarbs ?? computed.carbs}`} unit="g" />
        <Stat label={t.onboarding.statFatLabel} value={`${data.manualFat ?? computed.fat}`} unit="g" />
        <Stat label={t.onboarding.statFiberLabel} value={`${data.manualFiber ?? computed.fiber}`} unit="g" />
        <Stat label={t.onboarding.statWaterLabel} value={`${data.manualWater ?? computed.water}`} unit="L" />
      </div>

      <ToggleRow
        label={t.onboarding.customizeManually}
        checked={data.isManualOverride}
        onChange={(isManualOverride) => update({ isManualOverride })}
      />

      {data.isManualOverride && (
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.common.caloriesLabel}>
            <TextInput
              type="number"
              value={data.manualCalories ?? computed.calories}
              onChange={(e) => update({ manualCalories: Number(e.target.value) })}
            />
          </Field>
          <Field label={t.common.proteinLabel}>
            <TextInput
              type="number"
              value={data.manualProtein ?? computed.protein}
              onChange={(e) => update({ manualProtein: Number(e.target.value) })}
            />
          </Field>
          <Field label={t.common.carbsLabel}>
            <TextInput
              type="number"
              value={data.manualCarbs ?? computed.carbs}
              onChange={(e) => update({ manualCarbs: Number(e.target.value) })}
            />
          </Field>
          <Field label={t.common.fatLabel}>
            <TextInput
              type="number"
              value={data.manualFat ?? computed.fat}
              onChange={(e) => update({ manualFat: Number(e.target.value) })}
            />
          </Field>
          <Field label={t.common.fiberLabel}>
            <TextInput
              type="number"
              value={data.manualFiber ?? computed.fiber}
              onChange={(e) => update({ manualFiber: Number(e.target.value) })}
            />
          </Field>
          <Field label={t.common.waterLabel}>
            <TextInput
              type="number"
              step={0.1}
              value={data.manualWater ?? computed.water}
              onChange={(e) => update({ manualWater: Number(e.target.value) })}
            />
          </Field>
        </div>
      )}
    </StepShell>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-lg font-semibold text-ink">
        {value}
        <span className="text-xs font-normal text-ink-faint"> {unit}</span>
      </div>
      <div className="text-xs text-ink-soft">{label}</div>
    </div>
  );
}
