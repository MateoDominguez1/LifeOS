import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Camera } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { NutritionNav } from "@/components/nutrition/nutrition-nav";
import { MacroBar } from "@/components/nutrition/MacroBar";
import { SuggestionCard } from "@/components/nutrition/SuggestionCard";
import { WaterButton } from "@/components/nutrition/WaterButton";
import { getDailyProgress } from "@/lib/nutrition/dashboard/getDailyProgress";
import { generateInsights } from "@/lib/nutrition/dashboard/insights";
import { suggestMeals } from "@/lib/nutrition/recipes/suggestMeals";
import { getT, INTL_LOCALES, type Dictionary } from "@/lib/i18n";

const MEAL_SLOTS = [
  { type: "BREAKFAST", emoji: "🌅" },
  { type: "LUNCH", emoji: "☀️" },
  { type: "DINNER", emoji: "🌙" },
  { type: "SNACK", emoji: "🍎" },
] as const;

const INSIGHT_STYLES: Record<string, string> = {
  green: "bg-money-soft text-money",
  yellow: "bg-warn-soft text-warn",
  red: "bg-danger-soft text-danger",
  neutral: "bg-surface-raised text-ink-soft",
};

const INSIGHT_EMOJI: Record<string, string> = {
  green: "🟢",
  yellow: "🟡",
  red: "🔴",
  neutral: "💬",
};

function greeting(t: Dictionary["dashboard"]): string {
  const hour = new Date().getHours();
  if (hour < 12) return t.greetingMorning;
  if (hour < 20) return t.greetingAfternoon;
  return t.greetingEvening;
}

export default async function NutritionPage() {
  const [userId, { locale, t }] = await Promise.all([requireUserId(), getT()]);

  const profile = await prisma.nutritionProfile.findUnique({ where: { userId } });
  if (!profile) redirect("/nutrition/onboarding");

  const { meals, consumed, waterLiters, goals } = await getDailyProgress(userId);
  const insights = goals ? generateInsights(consumed, goals) : [];
  const caloriesRemaining = goals ? Math.round(goals.calories - consumed.calories) : 0;

  const suggestions =
    goals && caloriesRemaining > 150
      ? await suggestMeals(userId, {
          calories: caloriesRemaining,
          protein: Math.max(goals.protein - consumed.protein, 0),
          carbs: Math.max(goals.carbs - consumed.carbs, 0),
          fat: Math.max(goals.fat - consumed.fat, 0),
        })
      : [];

  const mealsByType = MEAL_SLOTS.map((slot) => ({
    ...slot,
    meals: meals.filter((m) => m.mealType === slot.type),
  }));

  const caloriesPct = goals ? Math.min((consumed.calories / goals.calories) * 100, 100) : 0;

  return (
    <div>
      <NutritionNav />

      <header className="mb-6">
        <h1 className="font-display text-xl font-bold text-ink">{greeting(t.dashboard)} 👋</h1>
        <p className="text-sm text-ink-soft">
          {new Date().toLocaleDateString(INTL_LOCALES[locale], {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </header>

      {!goals ? (
        <Card className="text-center text-sm text-ink-soft">
          {t.nutrition.dashboard.goalsNotConfigured}
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <Card domain="nutrition" className="text-center">
            <div className="font-display text-4xl font-bold tracking-tight text-ink">
              {Math.round(consumed.calories)}
              <span className="text-lg font-normal text-ink-faint"> / {goals.calories} kcal</span>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              {caloriesRemaining >= 0
                ? `${caloriesRemaining} ${t.nutrition.dashboard.caloriesRemainingSuffix}`
                : `${Math.abs(caloriesRemaining)} ${t.nutrition.dashboard.caloriesOverSuffix}`}
            </p>
            <ProgressBar value={caloriesPct} tone={caloriesRemaining < 0 ? "danger" : "nutrition"} className="mt-3" />
          </Card>

          <Card className="flex flex-col gap-3">
            {goals.trackProtein && <MacroBar label={t.nutrition.onboarding.trackProtein} value={consumed.protein} goal={goals.protein} unit="g" />}
            {goals.trackCarbs && <MacroBar label={t.nutrition.onboarding.trackCarbs} value={consumed.carbs} goal={goals.carbs} unit="g" />}
            {goals.trackFat && <MacroBar label={t.nutrition.onboarding.trackFat} value={consumed.fat} goal={goals.fat} unit="g" />}
            {goals.trackFiber && <MacroBar label={t.nutrition.onboarding.trackFiber} value={consumed.fiber} goal={goals.fiber} unit="g" />}
            {goals.trackWater && (
              <div className="space-y-1.5">
                <MacroBar label={t.nutrition.onboarding.trackWater} value={waterLiters} goal={goals.water} unit="L" decimals={1} />
                <div className="flex justify-end gap-2 pt-1">
                  <WaterButton amountMl={250} />
                  <WaterButton amountMl={500} />
                </div>
              </div>
            )}
          </Card>

          {insights.length > 0 && (
            <div className="flex flex-col gap-2">
              {insights.map((insight, i) => (
                <div key={i} className={`rounded-xl px-4 py-2.5 text-sm ${INSIGHT_STYLES[insight.level]}`}>
                  {INSIGHT_EMOJI[insight.level]} {insight.text}
                </div>
              ))}
            </div>
          )}

          {suggestions.length > 0 && <SuggestionCard suggestions={suggestions} />}
        </div>
      )}

      <section className="mt-6 flex flex-col gap-3">
        <h2 className="font-display text-sm font-medium text-ink-soft">{t.nutrition.dashboard.todaysMeals}</h2>
        {mealsByType.map((slot) => (
          <Card key={slot.type} className="p-3">
            <p className="mb-1 text-xs font-medium text-ink-faint">
              {slot.emoji} {t.mealTypes[slot.type]}
            </p>
            {slot.meals.length === 0 ? (
              <Link href="/nutrition/add" className="text-sm text-ink-faint underline underline-offset-2 hover:text-ink">
                {t.nutrition.dashboard.addMealLink}
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                {slot.meals.map((meal) => (
                  <div key={meal.id} className="flex items-center gap-3">
                    {meal.photoUrl && (
                      <Image
                        src={meal.photoUrl}
                        alt={meal.name}
                        width={48}
                        height={48}
                        unoptimized
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{meal.name}</p>
                      <p className="text-xs text-ink-faint">≈ {Math.round(meal.totalCalories)} kcal</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </section>

      <Link
        href="/nutrition/add"
        className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-nutrition px-4 py-3 text-center font-display text-sm font-medium text-white hover:opacity-90"
      >
        <Camera size={16} /> {t.nutrition.dashboard.analyzeMealCta}
      </Link>

      <div className="mt-4 flex justify-center gap-4">
        <Link href="/nutrition/foods" className="text-sm text-ink-faint underline underline-offset-2 hover:text-ink">
          {t.nutrition.dashboard.searchFoodsLink}
        </Link>
        <Link href="/nutrition/recipes" className="text-sm text-ink-faint underline underline-offset-2 hover:text-ink">
          {t.nutrition.dashboard.myRecipesLink}
        </Link>
      </div>
    </div>
  );
}
