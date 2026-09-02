import type { EquipmentType } from "@/generated/prisma/client";
import type { OnboardingData } from "../types";
import { Chip, StepShell } from "@/components/fitness/form";

const EQUIPMENT_OPTIONS: { value: EquipmentType; label: string }[] = [
  { value: "FULL_GYM", label: "Gimnasio completo" },
  { value: "BASIC_GYM", label: "Gimnasio básico" },
  { value: "HOME_GYM", label: "Gimnasio en casa" },
  { value: "DUMBBELLS", label: "Mancuernas" },
  { value: "MACHINES", label: "Máquinas" },
  { value: "BARBELL", label: "Barra" },
  { value: "BODYWEIGHT", label: "Peso corporal" },
  { value: "OTHER", label: "Otro" },
];

export function Step4Equipment({ data, update }: { data: OnboardingData; update: (patch: Partial<OnboardingData>) => void }) {
  return (
    <StepShell title="Equipamiento disponible" subtitle="Elegí todo lo que tengas a mano.">
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
