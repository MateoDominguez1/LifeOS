import type { OnboardingData } from "../types";
import { StepShell, ToggleRow } from "@/components/nutrition/form";

const TRACKS: { key: keyof OnboardingData; label: string }[] = [
  { key: "trackCalories", label: "Calorías" },
  { key: "trackProtein", label: "Proteínas" },
  { key: "trackCarbs", label: "Carbohidratos" },
  { key: "trackFat", label: "Grasas" },
  { key: "trackFiber", label: "Fibra" },
  { key: "trackWater", label: "Agua" },
  { key: "trackSugar", label: "Azúcar" },
  { key: "trackMicronutrients", label: "Micronutrientes" },
];

export function Step6Tracking({
  data,
  update,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
}) {
  return (
    <StepShell title="¿Qué querés trackear?" subtitle="Podés cambiar esto después desde tu perfil.">
      <div className="space-y-2">
        {TRACKS.map((t) => (
          <ToggleRow
            key={t.key}
            label={t.label}
            checked={Boolean(data[t.key])}
            onChange={(checked) => update({ [t.key]: checked } as Partial<OnboardingData>)}
          />
        ))}
      </div>
    </StepShell>
  );
}
