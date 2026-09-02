"use client";

import { useTransition } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { abandonGoal, markGoalAchieved } from "./actions";
import type { GoalProgress } from "@/lib/goals/progress";
import type { Dictionary } from "@/lib/i18n";

const DOMAIN_TONE: Record<string, "money" | "nutrition" | "fitness" | "accent"> = {
  FINANCE: "money",
  NUTRITION: "nutrition",
  FITNESS: "fitness",
  BODY: "accent",
};

export function GoalCard({
  id,
  label,
  domain,
  progress,
  t,
}: {
  id: string;
  label: string;
  domain: "BODY" | "FINANCE" | "NUTRITION" | "FITNESS";
  progress: GoalProgress;
  t: Dictionary;
}) {
  const [isPending, startTransition] = useTransition();
  const tone = DOMAIN_TONE[domain] ?? "accent";

  return (
    <Card domain={tone === "accent" ? "accent" : tone}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <CardLabel>{label}</CardLabel>
          <p className="mt-1 text-sm text-ink-soft">
            {progress.current != null
              ? `${progress.current} / ${progress.target} ${progress.unit}`
              : `${t.goals.targetLabel}: ${progress.target} ${progress.unit}`}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => markGoalAchieved(id))}
            className="rounded-lg px-2 py-1 text-xs font-medium text-money hover:bg-money-soft"
          >
            {t.goals.achieved}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => abandonGoal(id))}
            className="rounded-lg px-2 py-1 text-xs font-medium text-ink-faint hover:bg-surface-raised"
          >
            {t.goals.abandon}
          </button>
        </div>
      </div>
      {progress.percent != null && <ProgressBar value={progress.percent} tone={tone} className="mt-3" />}
    </Card>
  );
}
