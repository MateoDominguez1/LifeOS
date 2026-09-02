import type { Goal } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { complianceFor } from "@/lib/nutrition/history/getMonthlyHistory";
import { getWeekRange } from "@/lib/fitness/today";

export interface GoalProgress {
  current: number | null;
  target: number;
  unit: string;
  percent: number | null;
}

const UNIT_BY_METRIC: Record<Goal["metric"], string> = {
  SAVINGS: "€",
  PROTEIN_TARGET_STREAK: "días",
  CALORIE_ADHERENCE: "%",
  BODY_WEIGHT: "kg",
  EXERCISE_WEIGHT: "kg",
  BODY_MEASUREMENT: "cm",
  WORKOUT_FREQUENCY: "sesiones/sem",
};

function toPercent(current: number | null, target: number): number | null {
  if (current == null || target <= 0) return null;
  return Math.min(Math.round((current / target) * 100), 100);
}

export async function computeGoalProgress(goal: Goal): Promise<GoalProgress> {
  const target = Number(goal.targetValue);
  const unit = UNIT_BY_METRIC[goal.metric];

  switch (goal.metric) {
    case "SAVINGS": {
      if (!goal.accountId) return { current: null, target, unit, percent: null };
      const account = await prisma.account.findUnique({ where: { id: goal.accountId } });
      const current = account ? Number(account.balance) : null;
      return { current, target, unit, percent: toPercent(current, target) };
    }

    case "BODY_WEIGHT": {
      const entry = await prisma.weightEntry.findFirst({
        where: { userId: goal.userId, managedProfileId: goal.managedProfileId },
        orderBy: { loggedAt: "desc" },
      });
      const current = entry?.weightKg ?? null;
      // No stored starting weight, and the goal could be a loss or a gain —
      // a naive current/target ratio would show a misleading "100%" for a
      // weight-loss goal the moment current happens to exceed target. Show
      // the numbers, skip the bar.
      return { current, target, unit, percent: null };
    }

    case "EXERCISE_WEIGHT": {
      if (!goal.exerciseId) return { current: null, target, unit, percent: null };
      const pr = await prisma.personalRecord.findFirst({
        where: { userId: goal.userId, managedProfileId: goal.managedProfileId, exerciseId: goal.exerciseId, type: "MAX_WEIGHT" },
        orderBy: { value: "desc" },
      });
      const current = pr?.value ?? null;
      return { current, target, unit, percent: toPercent(current, target) };
    }

    case "BODY_MEASUREMENT": {
      if (!goal.measurementType) return { current: null, target, unit, percent: null };
      const measurement = await prisma.bodyMeasurement.findFirst({
        where: { userId: goal.userId, managedProfileId: goal.managedProfileId, type: goal.measurementType },
        orderBy: { loggedAt: "desc" },
      });
      const current = measurement?.valueCm ?? null;
      // Same direction-ambiguity as BODY_WEIGHT (could be a reduce-waist or
      // build-arms goal) — show numbers only, no bar.
      return { current, target, unit, percent: null };
    }

    case "WORKOUT_FREQUENCY": {
      const { start, end } = getWeekRange();
      const count = await prisma.workoutSession.count({
        where: { userId: goal.userId, managedProfileId: goal.managedProfileId, completedAt: { gte: start, lt: end } },
      });
      return { current: count, target, unit, percent: toPercent(count, target) };
    }

    case "CALORIE_ADHERENCE": {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const [meals, goals] = await Promise.all([
        prisma.meal.findMany({ where: { userId: goal.userId, loggedAt: { gte: since } } }),
        prisma.nutritionGoals.findUnique({ where: { userId: goal.userId } }),
      ]);
      if (!goals || meals.length === 0) return { current: null, target, unit, percent: null };

      const byDay = new Map<string, number>();
      for (const meal of meals) {
        const key = meal.loggedAt.toISOString().slice(0, 10);
        byDay.set(key, (byDay.get(key) ?? 0) + meal.totalCalories);
      }
      const days = [...byDay.values()];
      const onTarget = days.filter((cals) => {
        const c = complianceFor(cals, goals.calories);
        return c === "green" || c === "yellow";
      }).length;
      const current = Math.round((onTarget / days.length) * 100);
      return { current, target, unit, percent: toPercent(current, target) };
    }

    case "PROTEIN_TARGET_STREAK": {
      const goals = await prisma.nutritionGoals.findUnique({ where: { userId: goal.userId } });
      if (!goals) return { current: null, target, unit, percent: null };

      let streak = 0;
      for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
        const dayStart = new Date();
        dayStart.setDate(dayStart.getDate() - dayOffset);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const meals = await prisma.meal.findMany({ where: { userId: goal.userId, loggedAt: { gte: dayStart, lt: dayEnd } } });
        if (meals.length === 0) break;

        const protein = meals.reduce((sum, m) => sum + m.totalProtein, 0);
        if (protein < goals.protein) break;
        streak++;
      }
      return { current: streak, target, unit, percent: toPercent(streak, target) };
    }

    default:
      return { current: null, target, unit, percent: null };
  }
}

export async function getGoalsWithProgress(userId: string, managedProfileId: string | null = null) {
  const goals = await prisma.goal.findMany({
    where: { userId, managedProfileId, status: "ACTIVE" },
    include: { exercise: true, account: true },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    goals.map(async (goal) => ({
      goal,
      progress: await computeGoalProgress(goal),
    }))
  );
}
