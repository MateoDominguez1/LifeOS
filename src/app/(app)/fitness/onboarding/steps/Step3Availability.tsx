import type { OnboardingData } from "../types";
import { Chip, Field, StepShell } from "@/components/fitness/form";
import type { Dictionary } from "@/lib/i18n";

const DURATIONS = [30, 45, 60, 75, 90];

export function Step3Availability({
  data,
  update,
  t,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  t: Dictionary;
}) {
  const WEEKDAYS = [
    { value: 0, label: t.fitness.weekdayAbbrev.sun },
    { value: 1, label: t.fitness.weekdayAbbrev.mon },
    { value: 2, label: t.fitness.weekdayAbbrev.tue },
    { value: 3, label: t.fitness.weekdayAbbrev.wed },
    { value: 4, label: t.fitness.weekdayAbbrev.thu },
    { value: 5, label: t.fitness.weekdayAbbrev.fri },
    { value: 6, label: t.fitness.weekdayAbbrev.sat },
  ];

  return (
    <StepShell title={t.fitness.onboarding.step3Title} subtitle={t.fitness.onboarding.step3Subtitle}>
      <Field label={t.fitness.onboarding.trainingDaysLabel}>
        <div className="grid grid-cols-4 gap-2">
          {WEEKDAYS.map((day) => (
            <Chip
              key={day.value}
              label={day.label}
              selected={data.trainingDays.includes(day.value)}
              onClick={() =>
                update({
                  trainingDays: data.trainingDays.includes(day.value)
                    ? data.trainingDays.filter((d) => d !== day.value)
                    : [...data.trainingDays, day.value].sort((a, b) => a - b),
                })
              }
            />
          ))}
        </div>
      </Field>

      <Field label={t.fitness.onboarding.sessionDurationLabel}>
        <div className="grid grid-cols-5 gap-2">
          {DURATIONS.map((min) => (
            <Chip key={min} label={String(min)} selected={data.sessionDurationMin === min} onClick={() => update({ sessionDurationMin: min })} />
          ))}
        </div>
      </Field>
    </StepShell>
  );
}
