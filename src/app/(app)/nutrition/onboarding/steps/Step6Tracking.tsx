import type { OnboardingData } from "../types";
import { StepShell, ToggleRow } from "@/components/nutrition/form";
import type { Dictionary } from "@/lib/i18n";

export function Step6Tracking({
  data,
  update,
  t,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  t: Dictionary["nutrition"];
}) {
  const TRACKS: { key: keyof OnboardingData; label: string }[] = [
    { key: "trackCalories", label: t.onboarding.trackCalories },
    { key: "trackProtein", label: t.onboarding.trackProtein },
    { key: "trackCarbs", label: t.onboarding.trackCarbs },
    { key: "trackFat", label: t.onboarding.trackFat },
    { key: "trackFiber", label: t.onboarding.trackFiber },
    { key: "trackWater", label: t.onboarding.trackWater },
    { key: "trackSugar", label: t.onboarding.trackSugar },
    { key: "trackMicronutrients", label: t.onboarding.trackMicronutrients },
  ];

  return (
    <StepShell title={t.onboarding.step6Title} subtitle={t.onboarding.step6Subtitle}>
      <div className="space-y-2">
        {TRACKS.map((track) => (
          <ToggleRow
            key={track.key}
            label={track.label}
            checked={Boolean(data[track.key])}
            onChange={(checked) => update({ [track.key]: checked } as Partial<OnboardingData>)}
          />
        ))}
      </div>
    </StepShell>
  );
}
