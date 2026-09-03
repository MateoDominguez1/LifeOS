import type { EquipmentType } from "@/generated/prisma/client";
import type { OnboardingData } from "../types";
import { Chip, StepShell } from "@/components/fitness/form";
import type { Dictionary } from "@/lib/i18n";

export function Step4Equipment({
  data,
  update,
  t,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  t: Dictionary;
}) {
  const EQUIPMENT_OPTIONS: { value: EquipmentType; label: string }[] = [
    { value: "FULL_GYM", label: t.fitness.onboarding.equipmentFullGym },
    { value: "BASIC_GYM", label: t.fitness.onboarding.equipmentBasicGym },
    { value: "HOME_GYM", label: t.fitness.onboarding.equipmentHomeGym },
    { value: "DUMBBELLS", label: t.fitness.onboarding.equipmentDumbbells },
    { value: "MACHINES", label: t.fitness.onboarding.equipmentMachines },
    { value: "BARBELL", label: t.fitness.onboarding.equipmentBarbell },
    { value: "BODYWEIGHT", label: t.fitness.onboarding.equipmentBodyweight },
    { value: "OTHER", label: t.fitness.onboarding.equipmentOther },
  ];

  return (
    <StepShell title={t.fitness.onboarding.step4Title} subtitle={t.fitness.onboarding.step4Subtitle}>
      <div className="grid grid-cols-2 gap-2">
        {EQUIPMENT_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            selected={data.equipment.includes(opt.value)}
            onClick={() =>
              update({
                equipment: data.equipment.includes(opt.value)
                  ? data.equipment.filter((e) => e !== opt.value)
                  : [...data.equipment, opt.value],
              })
            }
          />
        ))}
      </div>
    </StepShell>
  );
}
