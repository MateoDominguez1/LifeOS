import type { OnboardingData } from "../types";
import { Field, StepShell } from "@/components/fitness/form";
import type { Dictionary } from "@/lib/i18n";

export function Step6Limitations({
  data,
  update,
  t,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  t: Dictionary;
}) {
  return (
    <StepShell title={t.fitness.onboarding.step6Title} subtitle={t.fitness.onboarding.step6Subtitle}>
      <Field label={t.fitness.onboarding.limitationsLabel}>
        <textarea
          rows={4}
          placeholder={t.fitness.onboarding.limitationsPlaceholder}
          value={data.limitations}
          onChange={(e) => update({ limitations: e.target.value })}
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-fitness"
        />
      </Field>
    </StepShell>
  );
}
