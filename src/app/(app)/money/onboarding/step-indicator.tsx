import { cn } from "@/lib/cn";
import type { Dictionary } from "@/lib/i18n";

export function StepIndicator({ current, t }: { current: number; t: Dictionary }) {
  const STEPS = [t.money.onboarding.stepSalary, t.money.fixedExpenses.title, t.money.budgets.typeGrocery];

  return (
    <div className="mb-5 flex items-center gap-1.5">
      {STEPS.map((label, i) => {
        const step = i + 1;
        return (
          <div key={label} className="flex flex-1 items-center gap-1.5">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold",
                step === current
                  ? "bg-accent text-white"
                  : step < current
                    ? "bg-money-soft text-money"
                    : "bg-border-soft text-ink-faint"
              )}
            >
              {step}
            </div>
            {step < STEPS.length && <div className={cn("h-px flex-1", step < current ? "bg-money" : "bg-border")} />}
          </div>
        );
      })}
    </div>
  );
}
