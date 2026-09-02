import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card, CardLabel } from "@/components/ui/card";
import { NutritionNav } from "@/components/nutrition/nutrition-nav";
import { GoalsEditor } from "./GoalsEditor";
import { ProfileForm } from "./ProfileForm";

export default async function NutritionProfilePage() {
  const userId = await requireUserId();
  const session = await auth();

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
        <h1 className="font-display text-xl font-bold text-ink">Mi perfil</h1>
      </div>
      <p className="mb-6 text-sm text-ink-soft">{session?.user?.email}</p>

      <section className="mb-8 flex flex-col gap-3">
        <CardLabel>Datos personales</CardLabel>
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
          />
        </Card>
      </section>

      <section className="flex flex-col gap-3 border-t border-border-soft pt-6">
        <CardLabel>Objetivos nutricionales</CardLabel>
        <p className="text-xs text-ink-faint">Por defecto se recalculan solos cuando cambiás tus datos. Podés fijarlos manualmente.</p>
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
          />
        </Card>
      </section>
    </div>
  );
}
