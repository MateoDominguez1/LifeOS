"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { locales, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";
import { setLocale } from "@/app/(app)/settings/actions";
import { cn } from "@/lib/cn";

export function LanguageSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-1.5">
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await setLocale(locale);
              router.refresh();
            })
          }
          className={cn(
            "rounded-lg border px-3 py-1.5 font-display text-sm font-medium transition-colors disabled:opacity-50",
            current === locale ? "border-accent bg-accent-soft text-accent-ink" : "border-border text-ink-soft hover:border-accent/50"
          )}
        >
          {LOCALE_LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
