import type { OnboardingData } from "../types";
import { Chip, Field, StepShell } from "@/components/fitness/form";

const WEEKDAYS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
];

const DURATIONS = [30, 45, 60, 75, 90];

export function Step3Availability({ data, update }: { data: OnboardingData; update: (patch: Partial<OnboardingData>) => void }) {
  return (
    <StepShell title="Disponibilidad" subtitle="¿Qué días podés entrenar?">
      <Field label="Días de entrenamiento">
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

      <Field label="Duración de sesión (min)">
        <div className="grid grid-cols-5 gap-2">
          {DURATIONS.map((min) => (
            <Chip key={min} label={String(min)} selected={data.sessionDurationMin === min} onClick={() => update({ sessionDurationMin: min })} />
          ))}
        </div>
      </Field>
    </StepShell>
  );
}
