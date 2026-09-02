import { cn } from "@/lib/cn";

type Tone = "money" | "nutrition" | "fitness" | "warn" | "danger" | "accent";

const toneClasses: Record<Tone, string> = {
  money: "bg-money",
  nutrition: "bg-nutrition",
  fitness: "bg-fitness",
  warn: "bg-warn",
  danger: "bg-danger",
  accent: "bg-accent",
};

export function ProgressBar({
  value,
  tone = "money",
  className,
}: {
  value: number;
  tone?: Tone;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-border-soft", className)}>
      <div
        className={cn("h-full rounded-full transition-[width]", toneClasses[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
