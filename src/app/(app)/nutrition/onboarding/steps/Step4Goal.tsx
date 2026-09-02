import type { GoalType } from "@/lib/nutrition/types";
import type { OnboardingData } from "../types";
import { Field, OptionCard, StepShell, TextInput } from "@/components/nutrition/form";

export const GOAL_OPTIONS: { value: GoalType; label: string }[] = [
  { value: "LOSE_FAT", label: "Perder grasa" },
  { value: "GAIN_MUSCLE", label: "Ganar masa muscular" },
  { value: "MAINTAIN", label: "Mantener peso" },
  { value: "RECOMPOSITION", label: "Recomposición corporal" },
  { value: "IMPROVE_DIET", label: "Mejorar alimentación" },
  { value: "OTHER", label: "Otro" },
];

export function Step4Goal({
  data,
  update,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
}) {
  const showRate = data.goalType === "LOSE_FAT" || data.goalType === "GAIN_MUSCLE";

  return (
    <StepShell title="¿Cuál es tu objetivo principal?">
      <div className="grid grid-cols-2 gap-2">
        {GOAL_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            value={opt.value}
            currentValue={data.goalType}
            label={opt.label}
            onSelect={(goalType) => update({ goalType })}
          />
        ))}
      </div>

      {showRate && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ritmo objetivo (kg/semana) — opcional">
            <TextInput
              type="number"
              min={0.1}
              max={1.5}
              step={0.1}
              placeholder="Ej: 0.5"
              value={data.goalRateKgPerWeek ?? ""}
              onChange={(e) =>
                update({
                  goalRateKgPerWeek: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </Field>
          <Field label="Fecha objetivo — opcional">
            <TextInput
              type="date"
              value={data.goalTargetDate}
              onChange={(e) => update({ goalTargetDate: e.target.value })}
            />
          </Field>
        </div>
      )}
    </StepShell>
  );
}
