import { StepShell } from "@/components/nutrition/form";
import type { Dictionary } from "@/lib/i18n";

export function Step1Welcome({ t }: { t: Dictionary["nutrition"] }) {
  return (
    <StepShell emoji="👋" title={t.onboarding.step1Title}>
      <p className="text-sm text-ink-soft">{t.onboarding.step1Body}</p>
    </StepShell>
  );
}
