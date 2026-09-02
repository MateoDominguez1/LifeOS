import type { Sex } from "@/lib/nutrition/types";
import type { OnboardingData } from "../types";
import { Field, OptionCard, StepShell, TextInput } from "@/components/nutrition/form";

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: "MALE", label: "Masculino" },
  { value: "FEMALE", label: "Femenino" },
  { value: "OTHER", label: "Otro" },
];

export function Step2Personal({
  data,
  update,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
}) {
  return (
    <StepShell title="Datos personales" subtitle="Para calcular tu metabolismo basal.">
      <Field label="Edad">
        <TextInput
          type="number"
          min={10}
          max={100}
          value={data.age ?? ""}
          onChange={(e) => update({ age: e.target.value ? Number(e.target.value) : null })}
        />
      </Field>

      <Field label="Sexo">
        <div className="grid grid-cols-3 gap-2">
          {SEX_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              value={opt.value}
              currentValue={data.sex}
              label={opt.label}
              onSelect={(sex) => update({ sex })}
            />
          ))}
        </div>
      </Field>

      <Field label="Altura (cm)">
        <TextInput
          type="number"
          min={100}
          max={250}
          value={data.heightCm ?? ""}
          onChange={(e) => update({ heightCm: e.target.value ? Number(e.target.value) : null })}
        />
      </Field>

      <Field label="Peso actual (kg)">
        <TextInput
          type="number"
          min={30}
          max={300}
          step={0.1}
          value={data.weightKg ?? ""}
          onChange={(e) => update({ weightKg: e.target.value ? Number(e.target.value) : null })}
        />
      </Field>

      <Field label="Peso objetivo (kg) — opcional">
        <TextInput
          type="number"
          min={30}
          max={300}
          step={0.1}
          value={data.weightGoalKg ?? ""}
          onChange={(e) =>
            update({ weightGoalKg: e.target.value ? Number(e.target.value) : null })
          }
        />
      </Field>
    </StepShell>
  );
}
