import { useMemo } from "react";
import { calculateNutritionGoals } from "@/lib/nutrition/calculations";
import type { OnboardingData } from "../types";
import { Field, StepShell, TextInput, ToggleRow } from "@/components/nutrition/form";

export function Step7Goals({
  data,
  update,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
}) {
  const computed = useMemo(() => {
    if (!data.sex || !data.age || !data.heightCm || !data.weightKg || !data.activityLevel || !data.goalType) {
      return null;
    }
    return calculateNutritionGoals({
      sex: data.sex,
      age: data.age,
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      activityLevel: data.activityLevel,
      goalType: data.goalType,
      goalRateKgPerWeek: data.goalRateKgPerWeek ?? undefined,
    });
  }, [data.sex, data.age, data.heightCm, data.weightKg, data.activityLevel, data.goalType, data.goalRateKgPerWeek]);

  if (!computed) {
    return (
      <StepShell title="Tus objetivos nutricionales">
        <p className="text-sm text-ink-soft">Completá los pasos anteriores para calcular tus objetivos.</p>
      </StepShell>
    );
  }

  return (
    <StepShell title="Tus objetivos nutricionales" subtitle="Calculados a partir de tus datos. Podés personalizarlos.">
      <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border-soft p-4">
        <Stat label="Calorías" value={`${data.manualCalories ?? computed.calories}`} unit="kcal" />
        <Stat label="Proteína" value={`${data.manualProtein ?? computed.protein}`} unit="g" />
        <Stat label="Carbos" value={`${data.manualCarbs ?? computed.carbs}`} unit="g" />
        <Stat label="Grasas" value={`${data.manualFat ?? computed.fat}`} unit="g" />
        <Stat label="Fibra" value={`${data.manualFiber ?? computed.fiber}`} unit="g" />
        <Stat label="Agua" value={`${data.manualWater ?? computed.water}`} unit="L" />
      </div>

      <ToggleRow
        label="Personalizar manualmente"
        checked={data.isManualOverride}
        onChange={(isManualOverride) => update({ isManualOverride })}
      />

      {data.isManualOverride && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Calorías (kcal)">
            <TextInput
              type="number"
              value={data.manualCalories ?? computed.calories}
              onChange={(e) => update({ manualCalories: Number(e.target.value) })}
            />
          </Field>
          <Field label="Proteína (g)">
            <TextInput
              type="number"
              value={data.manualProtein ?? computed.protein}
              onChange={(e) => update({ manualProtein: Number(e.target.value) })}
            />
          </Field>
          <Field label="Carbohidratos (g)">
            <TextInput
              type="number"
              value={data.manualCarbs ?? computed.carbs}
              onChange={(e) => update({ manualCarbs: Number(e.target.value) })}
            />
          </Field>
          <Field label="Grasas (g)">
            <TextInput
              type="number"
              value={data.manualFat ?? computed.fat}
              onChange={(e) => update({ manualFat: Number(e.target.value) })}
            />
          </Field>
          <Field label="Fibra (g)">
            <TextInput
              type="number"
              value={data.manualFiber ?? computed.fiber}
              onChange={(e) => update({ manualFiber: Number(e.target.value) })}
            />
          </Field>
          <Field label="Agua (L)">
            <TextInput
              type="number"
              step={0.1}
              value={data.manualWater ?? computed.water}
              onChange={(e) => update({ manualWater: Number(e.target.value) })}
            />
          </Field>
        </div>
      )}
    </StepShell>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-lg font-semibold text-ink">
        {value}
        <span className="text-xs font-normal text-ink-faint"> {unit}</span>
      </div>
      <div className="text-xs text-ink-soft">{label}</div>
    </div>
  );
}
