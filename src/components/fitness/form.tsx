import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function StepShell({
  emoji,
  title,
  subtitle,
  children,
}: {
  emoji?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        {emoji && <div className="text-3xl">{emoji}</div>}
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">{title}</h2>
        {subtitle && <p className="text-sm text-ink-soft">{subtitle}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="font-display text-sm font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

const inputClasses =
  "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-fitness";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputClasses} />;
}

export function Chip({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border px-4 py-3 text-left transition-colors",
        selected ? "border-fitness bg-fitness-soft text-fitness" : "border-border hover:bg-surface-raised"
      )}
    >
      <div className="font-display text-sm font-medium">{label}</div>
      {description && <div className={cn("text-xs", selected ? "text-fitness/70" : "text-ink-faint")}>{description}</div>}
    </button>
  );
}
