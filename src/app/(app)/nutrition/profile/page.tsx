import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card, CardLabel } from "@/components/ui/card";
import { NutritionNav } from "@/components/nutrition/nutrition-nav";
import { getT } from "@/lib/i18n";
import { GoalsEditor } from "./GoalsEditor";
import { ProfileForm } from "./ProfileForm";

export default async function NutritionProfilePage() {
  const [userId, session, { t }] = await Promise.all([requireUserId(), auth(), getT()]);

  const [bodyProfile, nutritionProfile, goals, latestWeight, weightGoal] = await Promise.all([
    prisma.bodyProfile.findUnique({ where: { userId } }),
    prisma.nutritionProfile.findUnique({ where: { userId } }),
    prisma.nutritionGoals.findUnique({ where: { userId } }),
    prisma.weightEntry.findFirst({ where: { userId }, orderBy: { loggedAt: "desc" } }),
    prisma.goal.findFirst({ where: { userId, domain: "BODY", metric: "BODY_WEIGHT", status: "ACTIVE" } }),
  ]);

  if (!bodyProfile || !nutritionProfile || !goals || !bodyProfile.age || !bodyProfile.sex || !bodyProfile.heightCm || !latestWeight) {
    redirect("/nutrition/onboarding");
  }

  return (
    <div>
      <NutritionNav />

      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-ink">{t.nutrition.profile.title}</h1>
      </div>
      <p className="mb-6 text-sm text-ink-soft">{session?.user?.email}</p>

      <section className="mb-8 flex flex-col gap-3">
        <CardLabel>{t.nutrition.profile.personalDataTitle}</CardLabel>
        <Card>
          <ProfileForm
            initial={{
              age: bodyProfile.age,
              sex: bodyProfile.sex,
              heightCm: bodyProfile.heightCm,
              weightKg: latestWeight.weightKg,
              weightGoalKg: weightGoal ? Number(weightGoal.targetValue) : null,
              activityLevel: nutritionProfile.activityLevel,
              goalType: nutritionProfile.goalType,
            }}
            t={t}
          />
        </Card>
      </section>

      <section className="flex flex-col gap-3 border-t border-border-soft pt-6">
        <CardLabel>{t.nutrition.profile.nutritionGoalsTitle}</CardLabel>
        <p className="text-xs text-ink-faint">{t.nutrition.profile.autoRecalcNote}</p>
        <Card>
          <GoalsEditor
            isManualOverride={goals.isManualOverride}
            initial={{
              calories: goals.calories,
              protein: goals.protein,
              carbs: goals.carbs,
              fat: goals.fat,
              fiber: goals.fiber,
              water: goals.water,
            }}
            t={t}
          />
        </Card>
      </section>
    </div>
  );
}
