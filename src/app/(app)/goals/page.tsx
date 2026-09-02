import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { getGoalsWithProgress } from "@/lib/goals/progress";
import { getT } from "@/lib/i18n";
import { GoalCard } from "./GoalCard";
import { NewGoalForm } from "./NewGoalForm";

export default async function GoalsPage() {
  const userId = await requireUserId();
  const { t } = await getT();

  const [goalsWithProgress, accounts, exercises] = await Promise.all([
    getGoalsWithProgress(userId),
    prisma.account.findMany({ where: { userId, isActive: true }, orderBy: { name: "asc" } }),
    prisma.exercise.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold tracking-tight">{t.goals.title}</h1>
      <p className="mb-6 text-sm text-ink-soft">{t.goals.subtitle}</p>

      <div className="mb-6">
        <NewGoalForm accounts={accounts} exercises={exercises} t={t} />
      </div>

      {goalsWithProgress.length === 0 ? (
        <Card className="text-center text-sm text-ink-soft">{t.goals.empty}</Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {goalsWithProgress.map(({ goal, progress }) => (
            <GoalCard key={goal.id} id={goal.id} label={goal.label} domain={goal.domain} progress={progress} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
