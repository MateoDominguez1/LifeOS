import type { GoalType } from "@/lib/nutrition/types";
import type { OnboardingData } from "../types";
import { Field, OptionCard, StepShell, TextInput } from "@/components/nutrition/form";
import type { Dictionary } from "@/lib/i18n";

export function Step4Goal({
  data,
  update,
  t,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  t: Dictionary["nutrition"];
}) {
  const showRate = data.goalType === "LOSE_FAT" || data.goalType === "GAIN_MUSCLE";

  const GOAL_OPTIONS: { value: GoalType; label: string }[] = [
    { value: "LOSE_FAT", label: t.onboarding.goalLoseFat },
    { value: "GAIN_MUSCLE", label: t.onboarding.goalGainMuscle },
    { value: "MAINTAIN", label: t.onboarding.goalMaintain },
    { value: "RECOMPOSITION", label: t.onboarding.goalRecomposition },
    { value: "IMPROVE_DIET", label: t.onboarding.goalImproveDiet },
    { value: "OTHER", label: t.onboarding.goalOther },
  ];

  return (
    <StepShell title={t.onboarding.step4Title}>
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
          <Field label={t.onboarding.goalRateLabel}>
            <TextInput
              type="number"
              min={0.1}
              max={1.5}
              step={0.1}
              placeholder={t.onboarding.goalRatePlaceholder}
              value={data.goalRateKgPerWeek ?? ""}
              onChange={(e) =>
                update({
                  goalRateKgPerWeek: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </Field>
          <Field label={t.onboarding.goalDateLabel}>
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
