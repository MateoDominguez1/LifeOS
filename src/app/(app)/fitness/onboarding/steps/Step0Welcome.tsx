import { StepShell } from "@/components/fitness/form";
import type { Dictionary } from "@/lib/i18n";

export function Step0Welcome({ t }: { t: Dictionary }) {
  return (
    <StepShell emoji="💪" title={t.fitness.onboarding.welcomeTitle}>
      <p className="text-sm text-ink-soft">{t.fitness.onboarding.welcomeBody}</p>
    </StepShell>
  );
}
