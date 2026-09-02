import { ProgressBar } from "@/components/ui/progress-bar";

export function MacroBar({
  label,
  value,
  goal,
  unit,
  decimals = 0,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  decimals?: number;
}) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  const isOver = goal > 0 && value > goal;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-display font-medium text-ink-soft">{label}</span>
        <span className="text-ink-faint">
          {value.toFixed(decimals)} / {goal.toFixed(decimals)} {unit}
        </span>
      </div>
      <ProgressBar value={pct} tone={isOver ? "danger" : "nutrition"} />
    </div>
  );
}
