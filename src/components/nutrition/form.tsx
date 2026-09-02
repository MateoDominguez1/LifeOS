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
  "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-nutrition";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputClasses} />;
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={inputClasses} />;
}

export function OptionCard<T extends string | boolean>({
  value,
  currentValue,
  label,
  description,
  onSelect,
}: {
  value: T;
  currentValue: T | null;
  label: string;
  description?: string;
  onSelect: (value: T) => void;
}) {
  const isSelected = value === currentValue;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        "w-full rounded-xl border px-4 py-3 text-left transition-colors",
        isSelected ? "border-nutrition bg-nutrition-soft text-nutrition" : "border-border hover:bg-surface-raised"
      )}
    >
      <div className="font-display text-sm font-medium">{label}</div>
      {description && <div className={cn("text-xs", isSelected ? "text-nutrition/70" : "text-ink-faint")}>{description}</div>}
    </button>
  );
}

export function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-left"
    >
      <span className="font-display text-sm font-medium text-ink">{label}</span>
      <span className={cn("h-6 w-10 shrink-0 rounded-full transition-colors", checked ? "bg-nutrition" : "bg-border-soft")}>
        <span
          className={cn(
            "block h-5 w-5 translate-y-0.5 rounded-full bg-white transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}
