import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { Card, CardLabel } from "@/components/ui/card";
import { Wallet, Utensils, Dumbbell, Target, Sparkles, ArrowRight } from "lucide-react";
import { getMoneySnapshot } from "@/lib/money/getMoneySnapshot";
import { formatCurrency } from "@/lib/money/format";
import { getNutritionSnapshot } from "@/lib/nutrition/getNutritionSnapshot";
import { getFitnessSnapshot } from "@/lib/fitness/getFitnessSnapshot";
import { getGoalsWithProgress } from "@/lib/goals/progress";
import { requireUserId } from "@/lib/auth/session";
import { getT, INTL_LOCALES, type Dictionary } from "@/lib/i18n";

function greeting(t: Dictionary["dashboard"]) {
  const hour = new Date().getHours();
  if (hour < 12) return t.greetingMorning;
  if (hour < 20) return t.greetingAfternoon;
  return t.greetingEvening;
}

export default async function DashboardPage() {
  const [session, userId, { locale, t }] = await Promise.all([auth(), requireUserId(), getT()]);
  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  const [moneySnapshot, nutritionSnapshot, fitnessSnapshot, goalsWithProgress] = await Promise.all([
    getMoneySnapshot(userId).catch(() => null),
    getNutritionSnapshot(userId).catch(() => null),
    getFitnessSnapshot(userId).catch(() => null),
    getGoalsWithProgress(userId).catch(() => []),
  ]);

  const activeModules = [moneySnapshot?.hasAccounts, nutritionSnapshot?.hasGoals, fitnessSnapshot?.hasProfile].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {greeting(t.dashboard)}{firstName ? `, ${firstName}` : ""} 👋
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {new Date().toLocaleDateString(INTL_LOCALES[locale], {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {moneySnapshot === null ? (
          <UnavailableCard icon={Wallet} title={t.nav.money} unavailable={t.dashboard.moneyUnavailable} />
        ) : (
          <MoneyCard snapshot={moneySnapshot} t={t} />
        )}
        {nutritionSnapshot === null ? (
          <UnavailableCard domain="nutrition" icon={Utensils} title={t.nav.nutrition} unavailable={t.dashboard.nutritionUnavailable} />
        ) : (
          <NutritionCard snapshot={nutritionSnapshot} t={t} />
        )}
        {fitnessSnapshot === null ? (
          <UnavailableCard domain="fitness" icon={Dumbbell} title={t.nav.fitness} unavailable={t.dashboard.fitnessUnavailable} />
        ) : (
          <FitnessCard snapshot={fitnessSnapshot} t={t} />
        )}
      </div>

      <Link href="/goals">
        <Card className="transition-colors hover:border-accent/40">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
              <Target size={18} />
            </div>
            <ArrowRight size={16} className="text-ink-faint" />
          </div>
          <CardLabel>{t.dashboard.goalsTitle}</CardLabel>
          {goalsWithProgress.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">{t.dashboard.goalsEmpty}</p>
          ) : (
            <div className="mt-2 flex flex-col gap-1.5">
              {goalsWithProgress.slice(0, 3).map(({ goal, progress }) => (
                <div key={goal.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-ink">{goal.label}</span>
                  <span className="shrink-0 text-ink-faint">
                    {progress.current != null ? `${progress.current}/${progress.target} ${progress.unit}` : `${progress.target} ${progress.unit}`}
                  </span>
                </div>
              ))}
              {goalsWithProgress.length > 3 && (
                <span className="text-xs text-ink-faint">
                  +{goalsWithProgress.length - 3} {t.dashboard.goalsMore}
                </span>
              )}
            </div>
          )}
        </Card>
      </Link>

      <Card domain="accent" className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
          <Sparkles size={18} />
        </div>
        <div>
          <CardLabel>{t.dashboard.aiTitle}</CardLabel>
          <p className="mt-1 text-sm text-ink-soft">{activeModules === 3 ? t.dashboard.aiActive : t.dashboard.aiPartial}</p>
        </div>
      </Card>
    </div>
  );
}

function MoneyCard({ snapshot, t }: { snapshot: Awaited<ReturnType<typeof getMoneySnapshot>>; t: Dictionary }) {
  return (
    <Link href="/money">
      <Card domain="money" className="h-full transition-colors hover:border-money/40">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-money-soft text-money">
            <Wallet size={18} />
          </div>
          <ArrowRight size={16} className="text-ink-faint" />
        </div>
        <CardLabel>{t.nav.money}</CardLabel>
        {snapshot.hasAccounts ? (
          <>
            <div className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-ink">
              {formatCurrency(snapshot.available)}
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              {t.dashboard.moneyAvailable} · {formatCurrency(snapshot.dailyLimit)}
              {t.dashboard.moneyPerDay} · {snapshot.daysRemaining}{" "}
              {snapshot.daysRemaining === 1 ? t.dashboard.moneyDayRemaining : t.dashboard.moneyDaysRemaining}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">{t.dashboard.moneyNoAccounts}</p>
        )}
      </Card>
    </Link>
  );
}

function NutritionCard({ snapshot, t }: { snapshot: Awaited<ReturnType<typeof getNutritionSnapshot>>; t: Dictionary }) {
  return (
    <Link href="/nutrition">
      <Card domain="nutrition" className="h-full transition-colors hover:border-nutrition/40">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-nutrition-soft text-nutrition">
            <Utensils size={18} />
          </div>
          <ArrowRight size={16} className="text-ink-faint" />
        </div>
        <CardLabel>{t.nav.nutrition}</CardLabel>
        {snapshot.hasGoals ? (
          <>
            <div className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-ink">
              {snapshot.consumedCalories} <span className="text-sm font-normal text-ink-faint">/ {snapshot.goalCalories} kcal</span>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              {snapshot.remaining >= 0 ? `${snapshot.remaining} ${t.dashboard.nutritionRemaining}` : `${Math.abs(snapshot.remaining)} ${t.dashboard.nutritionOver}`}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">{t.dashboard.nutritionNoGoals}</p>
        )}
      </Card>
    </Link>
  );
}

function FitnessCard({ snapshot, t }: { snapshot: Awaited<ReturnType<typeof getFitnessSnapshot>>; t: Dictionary }) {
  return (
    <Link href="/fitness">
      <Card domain="fitness" className="h-full transition-colors hover:border-fitness/40">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-fitness-soft text-fitness">
            <Dumbbell size={18} />
          </div>
          <ArrowRight size={16} className="text-ink-faint" />
        </div>
        <CardLabel>{t.nav.fitness}</CardLabel>
        {snapshot.hasProfile ? (
          <>
            <div className="mt-1.5 text-sm text-ink">
              {snapshot.todayLabel
                ? snapshot.todayCompleted
                  ? `${snapshot.todayLabel} — ${t.dashboard.fitnessCompleted}`
                  : snapshot.todayLabel
                : t.dashboard.fitnessRestDay}
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              {snapshot.weeklyCompleted} / {snapshot.weeklyGoal} {t.dashboard.fitnessWeekly}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">{t.dashboard.fitnessNoProfile}</p>
        )}
      </Card>
    </Link>
  );
}

function UnavailableCard({
  domain,
  icon: Icon,
  title,
  unavailable,
}: {
  domain?: "money" | "nutrition" | "fitness";
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  unavailable: string;
}) {
  const iconBg = {
    money: "bg-money-soft text-money",
    nutrition: "bg-nutrition-soft text-nutrition",
    fitness: "bg-fitness-soft text-fitness",
  }[domain ?? "money"];

  return (
    <Card domain={domain}>
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
        <Icon size={18} />
      </div>
      <CardLabel>{title}</CardLabel>
      <p className="mt-2 text-sm text-ink-soft">{unavailable}</p>
    </Card>
  );
}
