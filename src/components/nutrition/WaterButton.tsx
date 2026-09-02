"use client";

import { useTransition } from "react";
import { logWater } from "@/app/(app)/nutrition/dashboard-actions";

export function WaterButton({ amountMl = 250 }: { amountMl?: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => logWater(amountMl))}
      className="rounded-full border border-border px-3 py-1 text-xs font-medium text-ink-soft transition-colors hover:bg-surface-raised disabled:opacity-50"
    >
      + {amountMl} ml 💧
    </button>
  );
}
