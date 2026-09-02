import type { ExperienceLevel, Sex } from "@/generated/prisma/client";
import type { OnboardingData } from "../types";
import { Chip, Field, StepShell, TextInput } from "@/components/fitness/form";

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: "MALE", label: "Masculino" },
  { value: "FEMALE", label: "Femenino" },
  { value: "OTHER", label: "Otro" },
];

const LEVEL_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: "BEGINNER", label: "Principiante" },
  { value: "INTERMEDIATE", label: "Intermedio" },
  { value: "ADVANCED", label: "Avanzado" },
];

export function Step1About({ data, update }: { data: OnboardingData; update: (patch: Partial<OnboardingData>) => void }) {
  return (
    <StepShell title="Sobre vos" subtitle="Para calcular tu punto de partida.">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Edad">
          <TextInput type="number" value={data.age ?? ""} onChange={(e) => update({ age: e.target.value ? Number(e.target.value) : null })} />
        </Field>
        <Field label="Altura (cm)">
          <TextInput type="number" value={data.heightCm ?? ""} onChange={(e) => update({ heightCm: e.target.value ? Number(e.target.value) : null })} />
        </Field>
        <Field label="Peso actual (kg)">
          <TextInput
            type="number"
            step={0.1}
            value={data.weightKg ?? ""}
            onChange={(e) => update({ weightKg: e.target.value ? Number(e.target.value) : null })}
          />
        </Field>
        <Field label="Peso objetivo (kg)">
          <TextInput
            type="number"
            step={0.1}
            value={data.weightGoalKg ?? ""}
            onChange={(e) => update({ weightGoalKg: e.target.value ? Number(e.target.value) : null })}
          />
        </Field>
      </div>

      <Field label="Sexo">
        <div className="grid grid-cols-3 gap-2">
          {SEX_OPTIONS.map((opt) => (
            <Chip key={opt.value} label={opt.label} selected={data.sex === opt.value} onClick={() => update({ sex: opt.value })} />
          ))}
        </div>
      </Field>

      <Field label="Nivel de experiencia">
        <div className="grid grid-cols-3 gap-2">
          {LEVEL_OPTIONS.map((opt) => (
            <Chip key={opt.value} label={opt.label} selected={data.level === opt.value} onClick={() => update({ level: opt.value })} />
          ))}
        </div>
      </Field>
    </StepShell>
  );
}
