import { calculateNutritionGoals } from "@/lib/nutrition/calculations";
import type { OnboardingData } from "../types";
import { StepShell } from "@/components/nutrition/form";
import type { Dictionary } from "@/lib/i18n";

export function Step8Summary({ data, t }: { data: OnboardingData; t: Dictionary["nutrition"] }) {
  if (!data.sex || !data.age || !data.heightCm || !data.weightKg || !data.activityLevel || !data.goalType) {
    return (
      <StepShell title={t.onboarding.step8MissingTitle}>
        <p className="text-sm text-danger">{t.onboarding.step8MissingBody}</p>
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
    <StepShell title={t.onboarding.step8Title} subtitle={t.onboarding.step8Subtitle}>
      <div className="rounded-2xl border border-border-soft p-5 text-center">
        <div className="font-display text-3xl font-bold text-ink">{goals.calories} kcal</div>
        <div className="mt-2 flex justify-center gap-4 text-sm text-ink-soft">
          <span>{goals.protein} {t.onboarding.proteinUnit}</span>
          <span>{goals.carbs} {t.onboarding.carbsUnit}</span>
          <span>{goals.fat} {t.onboarding.fatUnit}</span>
        </div>
        <div className="mt-1 flex justify-center gap-4 text-xs text-ink-faint">
          <span>{goals.fiber} {t.onboarding.fiberUnit}</span>
          <span>{goals.water} {t.onboarding.waterUnit}</span>
        </div>
      </div>

      <p className="text-xs text-ink-faint">{t.onboarding.step8Note}</p>
    </StepShell>
  );
}
