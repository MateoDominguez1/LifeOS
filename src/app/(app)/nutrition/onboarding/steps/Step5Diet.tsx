import type { OnboardingData } from "../types";
import { Field, StepShell, TextInput } from "@/components/nutrition/form";
import type { Dictionary } from "@/lib/i18n";

export function Step5Diet({
  data,
  update,
  t,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  t: Dictionary["nutrition"];
}) {
  return (
    <StepShell title={t.onboarding.step5Title} subtitle={t.onboarding.step5Subtitle}>
      <Field label={t.onboarding.mealsPerDayLabel}>
        <TextInput
          type="number"
          min={1}
          max={10}
          value={data.mealsPerDay ?? ""}
          onChange={(e) =>
            update({ mealsPerDay: e.target.value ? Number(e.target.value) : null })
          }
        />
      </Field>

      <Field label={t.onboarding.dietaryPreferenceLabel}>
        <TextInput
          type="text"
          placeholder={t.onboarding.dietaryPreferencePlaceholder}
          value={data.dietaryPreference}
          onChange={(e) => update({ dietaryPreference: e.target.value })}
        />
      </Field>

      <Field label={t.onboarding.allergiesLabel}>
        <TextInput
          type="text"
          placeholder={t.onboarding.allergiesPlaceholder}
          value={data.allergies}
          onChange={(e) => update({ allergies: e.target.value })}
        />
      </Field>

      <Field label={t.onboarding.dietTypeLabel}>
        <TextInput
          type="text"
          placeholder={t.onboarding.dietTypePlaceholder}
          value={data.dietType}
          onChange={(e) => update({ dietType: e.target.value })}
        />
      </Field>

      <Field label={t.onboarding.favoriteFoodsLabel}>
        <TextInput
          type="text"
          value={data.favoriteFoods}
          onChange={(e) => update({ favoriteFoods: e.target.value })}
        />
      </Field>

      <Field label={t.onboarding.limitedFoodsLabel}>
        <TextInput
          type="text"
          value={data.limitedFoods}
          onChange={(e) => update({ limitedFoods: e.target.value })}
        />
      </Field>
    </StepShell>
  );
}
