import type { ExperienceLevel, Sex } from "@/generated/prisma/client";
import type { OnboardingData } from "../types";
import { Chip, Field, StepShell, TextInput } from "@/components/fitness/form";
import type { Dictionary } from "@/lib/i18n";

export function Step1About({
  data,
  update,
  t,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  t: Dictionary;
}) {
  const SEX_OPTIONS: { value: Sex; label: string }[] = [
    { value: "MALE", label: t.fitness.onboarding.sexMale },
    { value: "FEMALE", label: t.fitness.onboarding.sexFemale },
    { value: "OTHER", label: t.fitness.onboarding.sexOther },
  ];

  const LEVEL_OPTIONS: { value: ExperienceLevel; label: string }[] = [
    { value: "BEGINNER", label: t.fitness.onboarding.levelBeginner },
    { value: "INTERMEDIATE", label: t.fitness.onboarding.levelIntermediate },
    { value: "ADVANCED", label: t.fitness.onboarding.levelAdvanced },
  ];

  return (
    <StepShell title={t.fitness.onboarding.step1Title} subtitle={t.fitness.onboarding.step1Subtitle}>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.fitness.onboarding.ageLabel}>
          <TextInput type="number" value={data.age ?? ""} onChange={(e) => update({ age: e.target.value ? Number(e.target.value) : null })} />
        </Field>
        <Field label={t.fitness.onboarding.heightLabel}>
          <TextInput type="number" value={data.heightCm ?? ""} onChange={(e) => update({ heightCm: e.target.value ? Number(e.target.value) : null })} />
        </Field>
        <Field label={t.fitness.onboarding.weightCurrentLabel}>
          <TextInput
            type="number"
            step={0.1}
            value={data.weightKg ?? ""}
            onChange={(e) => update({ weightKg: e.target.value ? Number(e.target.value) : null })}
          />
        </Field>
        <Field label={t.fitness.onboarding.weightGoalLabel}>
          <TextInput
            type="number"
            step={0.1}
            value={data.weightGoalKg ?? ""}
            onChange={(e) => update({ weightGoalKg: e.target.value ? Number(e.target.value) : null })}
          />
        </Field>
      </div>

      <Field label={t.fitness.onboarding.sexLabel}>
        <div className="grid grid-cols-3 gap-2">
          {SEX_OPTIONS.map((opt) => (
            <Chip key={opt.value} label={opt.label} selected={data.sex === opt.value} onClick={() => update({ sex: opt.value })} />
          ))}
        </div>
      </Field>

      <Field label={t.fitness.onboarding.levelLabel}>
        <div className="grid grid-cols-3 gap-2">
          {LEVEL_OPTIONS.map((opt) => (
            <Chip key={opt.value} label={opt.label} selected={data.level === opt.value} onClick={() => update({ level: opt.value })} />
          ))}
        </div>
      </Field>
    </StepShell>
  );
}
