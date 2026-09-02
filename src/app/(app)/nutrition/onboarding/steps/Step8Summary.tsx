import { calculateNutritionGoals } from "@/lib/nutrition/calculations";
import type { OnboardingData } from "../types";
import { StepShell } from "@/components/nutrition/form";

export function Step8Summary({ data }: { data: OnboardingData }) {
  if (!data.sex || !data.age || !data.heightCm || !data.weightKg || !data.activityLevel || !data.goalType) {
    return (
      <StepShell title="Resumen">
        <p className="text-sm text-danger">Faltan datos de pasos anteriores.</p>
      </StepShell>
    );
  }

  const computed = calculateNutritionGoals({
    sex: data.sex,
    age: data.age,
    heightCm: data.heightCm,
    weightKg: data.weightKg,
    activityLevel: data.activityLevel,
    goalType: data.goalType,
    goalRateKgPerWeek: data.goalRateKgPerWeek ?? undefined,
  });

  const goals = {
    calories: data.manualCalories ?? computed.calories,
    protein: data.manualProtein ?? computed.protein,
    carbs: data.manualCarbs ?? computed.carbs,
    fat: data.manualFat ?? computed.fat,
    fiber: data.manualFiber ?? computed.fiber,
    water: data.manualWater ?? computed.water,
  };

  return (
    <StepShell title="Tu objetivo diario" subtitle="Listo. Esto es lo que vamos a trackear desde hoy.">
      <div className="rounded-2xl border border-border-soft p-5 text-center">
        <div className="font-display text-3xl font-bold text-ink">{goals.calories} kcal</div>
        <div className="mt-2 flex justify-center gap-4 text-sm text-ink-soft">
          <span>{goals.protein} g proteína</span>
          <span>{goals.carbs} g carbos</span>
          <span>{goals.fat} g grasas</span>
        </div>
        <div className="mt-1 flex justify-center gap-4 text-xs text-ink-faint">
          <span>{goals.fiber} g fibra</span>
          <span>{goals.water} L agua</span>
        </div>
      </div>

      <p className="text-xs text-ink-faint">
        Estos valores son una estimación a partir de tus datos y se pueden
        editar en cualquier momento desde tu perfil.
      </p>
    </StepShell>
  );
}
