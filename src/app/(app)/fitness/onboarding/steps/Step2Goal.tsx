import type { FitnessGoalType } from "@/generated/prisma/client";
import type { OnboardingData } from "../types";
import { Chip, Field, StepShell } from "@/components/fitness/form";

export const GOAL_OPTIONS: { value: FitnessGoalType; label: string }[] = [
  { value: "GAIN_MUSCLE", label: "Ganar músculo" },
  { value: "LOSE_FAT", label: "Perder grasa" },
  { value: "RECOMP", label: "Recomposición corporal" },
  { value: "GAIN_STRENGTH", label: "Ganar fuerza" },
  { value: "IMPROVE_CONDITIONING", label: "Mejorar condición física" },
  { value: "MAINTAIN", label: "Mantener" },
  { value: "OTHER", label: "Otro" },
];

export function Step2Goal({ data, update }: { data: OnboardingData; update: (patch: Partial<OnboardingData>) => void }) {
  const secondaryOptions = GOAL_OPTIONS.filter((o) => o.value !== data.primaryGoal);

  return (
    <StepShell title="¿Cuál es tu objetivo principal?">
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

      <Field label="Objetivos secundarios — opcional">
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
