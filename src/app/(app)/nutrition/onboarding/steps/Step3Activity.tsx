import type { ActivityLevel } from "@/lib/nutrition/types";
import type { OnboardingData } from "../types";
import { Field, OptionCard, StepShell, TextInput } from "@/components/nutrition/form";
import type { Dictionary } from "@/lib/i18n";

export function Step3Activity({
  data,
  update,
  t,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  t: Dictionary["nutrition"];
}) {
  const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; description: string }[] = [
    { value: "SEDENTARY", label: t.common.activitySedentary, description: t.onboarding.activitySedentaryDesc },
    { value: "LIGHT", label: t.common.activityLight, description: t.onboarding.activityLightDesc },
    { value: "MODERATE", label: t.common.activityModerate, description: t.onboarding.activityModerateDesc },
    { value: "ACTIVE", label: t.common.activityActive, description: t.onboarding.activityActiveDesc },
    { value: "VERY_ACTIVE", label: t.common.activityVeryActive, description: t.onboarding.activityVeryActiveDesc },
  ];

  return (
    <StepShell title={t.onboarding.step3Title} subtitle={t.onboarding.step3Subtitle}>
      <Field label={t.onboarding.activityLevelLabel}>
        <div className="space-y-2">
          {ACTIVITY_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              value={opt.value}
              currentValue={data.activityLevel}
              label={opt.label}
              description={opt.description}
              onSelect={(activityLevel) => update({ activityLevel })}
            />
          ))}
        </div>
      </Field>

      <Field label={t.onboarding.jobTypeLabel}>
        <div className="grid grid-cols-2 gap-2">
          <OptionCard
            value={true}
            currentValue={data.isSedentaryJob}
            label={t.onboarding.jobSedentary}
            onSelect={(isSedentaryJob) => update({ isSedentaryJob })}
          />
          <OptionCard
            value={false}
            currentValue={data.isSedentaryJob}
            label={t.onboarding.jobActive}
            onSelect={(isSedentaryJob) => update({ isSedentaryJob })}
          />
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t.onboarding.trainingDaysLabel}>
          <TextInput
            type="number"
            min={0}
            max={14}
            value={data.trainingDaysPerWeek ?? ""}
            onChange={(e) =>
              update({
                trainingDaysPerWeek: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
        </Field>
        <Field label={t.onboarding.trainingDurationLabel}>
          <TextInput
            type="number"
            min={0}
            max={600}
            value={data.trainingDurationMin ?? ""}
            onChange={(e) =>
              update({
                trainingDurationMin: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
        </Field>
      </div>

      <Field label={t.onboarding.otherSportsLabel}>
        <TextInput
          type="text"
          placeholder={t.onboarding.otherSportsPlaceholder}
          value={data.otherSports}
          onChange={(e) => update({ otherSports: e.target.value })}
        />
      </Field>
    </StepShell>
  );
}
