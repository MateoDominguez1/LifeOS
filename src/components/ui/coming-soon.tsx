import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  phase,
  description,
}: {
  icon: LucideIcon;
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-raised border border-border-soft text-ink-faint">
        <Icon size={24} />
      </div>
      <h1 className="font-display text-xl font-bold">{title}</h1>
      <p className="max-w-sm text-sm text-ink-soft">{description}</p>
      <span className="mt-1 font-mono text-xs uppercase tracking-wider text-ink-faint">
        {phase}
      </span>
    </div>
  );
}
