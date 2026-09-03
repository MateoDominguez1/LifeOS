import type { Sex } from "@/lib/nutrition/types";
import type { OnboardingData } from "../types";
import { Field, OptionCard, StepShell, TextInput } from "@/components/nutrition/form";
import type { Dictionary } from "@/lib/i18n";

export function Step2Personal({
  data,
  update,
  t,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  t: Dictionary["nutrition"];
}) {
  const SEX_OPTIONS: { value: Sex; label: string }[] = [
    { value: "MALE", label: t.common.sexMale },
    { value: "FEMALE", label: t.common.sexFemale },
    { value: "OTHER", label: t.common.sexOther },
  ];

  return (
    <StepShell title={t.onboarding.step2Title} subtitle={t.onboarding.step2Subtitle}>
      <Field label={t.common.ageLabel}>
        <TextInput
          type="number"
          min={10}
          max={100}
          value={data.age ?? ""}
          onChange={(e) => update({ age: e.target.value ? Number(e.target.value) : null })}
        />
      </Field>

      <Field label={t.common.sexLabel}>
        <div className="grid grid-cols-3 gap-2">
          {SEX_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              value={opt.value}
              currentValue={data.sex}
              label={opt.label}
              onSelect={(sex) => update({ sex })}
            />
          ))}
        </div>
      </Field>

      <Field label={t.common.heightLabel}>
        <TextInput
          type="number"
          min={100}
          max={250}
          value={data.heightCm ?? ""}
          onChange={(e) => update({ heightCm: e.target.value ? Number(e.target.value) : null })}
        />
      </Field>

      <Field label={t.common.currentWeightLabel}>
        <TextInput
          type="number"
          min={30}
          max={300}
          step={0.1}
          value={data.weightKg ?? ""}
          onChange={(e) => update({ weightKg: e.target.value ? Number(e.target.value) : null })}
        />
      </Field>

      <Field label={t.onboarding.weightGoalLabel}>
        <TextInput
          type="number"
          min={30}
          max={300}
          step={0.1}
          value={data.weightGoalKg ?? ""}
          onChange={(e) =>
            update({ weightGoalKg: e.target.value ? Number(e.target.value) : null })
          }
        />
      </Field>
    </StepShell>
  );
}
