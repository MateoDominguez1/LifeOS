import type { ActivityLevel } from "@/lib/nutrition/types";
import type { OnboardingData } from "../types";
import { Field, OptionCard, StepShell, TextInput } from "@/components/nutrition/form";

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: "SEDENTARY", label: "Sedentario", description: "Poco o nada de ejercicio" },
  { value: "LIGHT", label: "Ligero", description: "Ejercicio 1-3 días/semana" },
  { value: "MODERATE", label: "Moderado", description: "Ejercicio 3-5 días/semana" },
  { value: "ACTIVE", label: "Activo", description: "Ejercicio 6-7 días/semana" },
  { value: "VERY_ACTIVE", label: "Muy activo", description: "Entrenamiento intenso + trabajo físico" },
];

export function Step3Activity({
  data,
  update,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
}) {
  return (
    <StepShell title="Actividad física" subtitle="Para estimar cuánta energía gastás por día.">
      <Field label="Nivel de actividad diaria">
        <div className="space-y-2">
          {ACTIVITY_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              value={opt.value}
              currentValue={data.activityLevel}
              label={opt.label}
              description={opt.description}
              onSelect={(activityLevel) => update({ activityLevel })}
            />
          ))}
        </div>
      </Field>

      <Field label="Tu trabajo es...">
        <div className="grid grid-cols-2 gap-2">
          <OptionCard
            value={true}
            currentValue={data.isSedentaryJob}
            label="Sedentario"
            onSelect={(isSedentaryJob) => update({ isSedentaryJob })}
          />
          <OptionCard
            value={false}
            currentValue={data.isSedentaryJob}
            label="De movimiento"
            onSelect={(isSedentaryJob) => update({ isSedentaryJob })}
          />
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Días de entrenamiento/sem">
          <TextInput
            type="number"
            min={0}
            max={14}
            value={data.trainingDaysPerWeek ?? ""}
            onChange={(e) =>
              update({
                trainingDaysPerWeek: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
        </Field>
        <Field label="Duración (min)">
          <TextInput
            type="number"
            min={0}
            max={600}
            value={data.trainingDurationMin ?? ""}
            onChange={(e) =>
              update({
                trainingDurationMin: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
        </Field>
      </div>

      <Field label="Otros deportes — opcional">
        <TextInput
          type="text"
          placeholder="Ej: fútbol los sábados"
          value={data.otherSports}
          onChange={(e) => update({ otherSports: e.target.value })}
        />
      </Field>
    </StepShell>
  );
}
