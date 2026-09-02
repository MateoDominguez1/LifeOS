import type { OnboardingData } from "../types";
import { Field, StepShell, TextInput } from "@/components/nutrition/form";

export function Step5Diet({
  data,
  update,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
}) {
  return (
    <StepShell title="Alimentación" subtitle="Para adaptar sugerencias y evitar lo que no querés comer.">
      <Field label="Número habitual de comidas por día">
        <TextInput
          type="number"
          min={1}
          max={10}
          value={data.mealsPerDay ?? ""}
          onChange={(e) =>
            update({ mealsPerDay: e.target.value ? Number(e.target.value) : null })
          }
        />
      </Field>

      <Field label="Preferencia alimentaria">
        <TextInput
          type="text"
          placeholder="Ej: omnívoro, vegetariano, vegano..."
          value={data.dietaryPreference}
          onChange={(e) => update({ dietaryPreference: e.target.value })}
        />
      </Field>

      <Field label="Alergias / intolerancias (separadas por coma)">
        <TextInput
          type="text"
          placeholder="Ej: maní, lactosa"
          value={data.allergies}
          onChange={(e) => update({ allergies: e.target.value })}
        />
      </Field>

      <Field label="¿Seguís alguna dieta específica? — opcional">
        <TextInput
          type="text"
          placeholder="Ej: keto, low-carb"
          value={data.dietType}
          onChange={(e) => update({ dietType: e.target.value })}
        />
      </Field>

      <Field label="Alimentos favoritos (separados por coma) — opcional">
        <TextInput
          type="text"
          value={data.favoriteFoods}
          onChange={(e) => update({ favoriteFoods: e.target.value })}
        />
      </Field>

      <Field label="Alimentos que querés limitar (separados por coma)">
        <TextInput
          type="text"
          value={data.limitedFoods}
          onChange={(e) => update({ limitedFoods: e.target.value })}
        />
      </Field>
    </StepShell>
  );
}
