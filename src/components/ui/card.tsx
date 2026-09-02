import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Domain = "money" | "nutrition" | "fitness" | "accent" | "neutral";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  domain?: Domain;
}

const domainBorder: Record<Domain, string> = {
  money: "border-l-[3px] border-l-money",
  nutrition: "border-l-[3px] border-l-nutrition",
  fitness: "border-l-[3px] border-l-fitness",
  accent: "border-l-[3px] border-l-accent",
  neutral: "",
};

export function Card({ className, domain = "neutral", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-soft bg-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.15)]",
        domainBorder[domain],
        className
      )}
      {...props}
    />
  );
}

export function CardLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "font-display text-xs font-semibold uppercase tracking-wider text-ink-faint",
        className
      )}
      {...props}
    />
  );
}
