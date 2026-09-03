import type { FitnessGoalType } from "@/generated/prisma/client";
import type { OnboardingData } from "../types";
import { Chip, Field, StepShell } from "@/components/fitness/form";
import type { Dictionary } from "@/lib/i18n";

export function Step2Goal({
  data,
  update,
  t,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  t: Dictionary;
}) {
  const GOAL_OPTIONS: { value: FitnessGoalType; label: string }[] = [
    { value: "GAIN_MUSCLE", label: t.fitness.onboarding.goalGainMuscle },
    { value: "LOSE_FAT", label: t.fitness.onboarding.goalLoseFat },
    { value: "RECOMP", label: t.fitness.onboarding.goalRecomp },
    { value: "GAIN_STRENGTH", label: t.fitness.onboarding.goalGainStrength },
    { value: "IMPROVE_CONDITIONING", label: t.fitness.onboarding.goalImproveConditioning },
    { value: "MAINTAIN", label: t.fitness.onboarding.goalMaintain },
    { value: "OTHER", label: t.fitness.onboarding.goalOther },
  ];

  const secondaryOptions = GOAL_OPTIONS.filter((o) => o.value !== data.primaryGoal);

  return (
    <StepShell title={t.fitness.onboarding.step2Title}>
      <div className="grid grid-cols-2 gap-2">
        {GOAL_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            selected={data.primaryGoal === opt.value}
            onClick={() => update({ primaryGoal: opt.value, secondaryGoals: data.secondaryGoals.filter((g) => g !== opt.value) })}
          />
        ))}
      </div>

      <Field label={t.fitness.onboarding.secondaryGoalsLabel}>
        <div className="grid grid-cols-2 gap-2">
          {secondaryOptions.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              selected={data.secondaryGoals.includes(opt.value)}
              onClick={() =>
                update({
                  secondaryGoals: data.secondaryGoals.includes(opt.value)
                    ? data.secondaryGoals.filter((g) => g !== opt.value)
                    : [...data.secondaryGoals, opt.value],
                })
              }
            />
          ))}
        </div>
      </Field>
    </StepShell>
  );
}
