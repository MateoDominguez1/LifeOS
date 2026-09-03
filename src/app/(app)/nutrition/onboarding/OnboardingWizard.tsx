"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import type { Dictionary } from "@/lib/i18n";
import { completeOnboarding } from "./actions";
import { Step1Welcome } from "./steps/Step1Welcome";
import { Step2Personal } from "./steps/Step2Personal";
import { Step3Activity } from "./steps/Step3Activity";
import { Step4Goal } from "./steps/Step4Goal";
import { Step5Diet } from "./steps/Step5Diet";
import { Step6Tracking } from "./steps/Step6Tracking";
import { Step7Goals } from "./steps/Step7Goals";
import { Step8Summary } from "./steps/Step8Summary";
import { INITIAL_ONBOARDING_DATA, type OnboardingData } from "./types";

const TOTAL_STEPS = 8;

export function OnboardingWizard({ t }: { t: Dictionary }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING_DATA);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update(patch: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  const canAdvance = (() => {
    switch (step) {
      case 1:
        return Boolean(data.age && data.sex && data.heightCm && data.weightKg);
      case 2:
        return Boolean(data.activityLevel);
      case 3:
        return Boolean(data.goalType);
      default:
        return true;
    }
  })();

  function handleNext() {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  }

  function handleBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        await completeOnboarding(data);
        router.push("/nutrition");
        router.refresh();
      } catch {
        setError(t.nutrition.onboarding.saveError);
      }
    });
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="flex gap-1.5">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-nutrition" : "bg-border-soft")} />
        ))}
      </div>

      <div className="rounded-2xl border border-border-soft bg-surface p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.15)]">
        {step === 0 && <Step1Welcome t={t.nutrition} />}
        {step === 1 && <Step2Personal data={data} update={update} t={t.nutrition} />}
        {step === 2 && <Step3Activity data={data} update={update} t={t.nutrition} />}
        {step === 3 && <Step4Goal data={data} update={update} t={t.nutrition} />}
        {step === 4 && <Step5Diet data={data} update={update} t={t.nutrition} />}
        {step === 5 && <Step6Tracking data={data} update={update} t={t.nutrition} />}
        {step === 6 && <Step7Goals data={data} update={update} t={t.nutrition} />}
        {step === 7 && <Step8Summary data={data} t={t.nutrition} />}
      </div>

      {error && <p className="text-center text-sm text-danger">{error}</p>}

      <div className="flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={handleBack}
            disabled={isPending}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 font-display text-sm font-medium text-ink transition-colors hover:bg-surface-raised disabled:opacity-60"
          >
            {t.common.back}
          </button>
        )}
        {step < TOTAL_STEPS - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canAdvance}
            className="flex-1 rounded-xl bg-nutrition px-4 py-2.5 font-display text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-40"
          >
            {t.common.next}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="flex-1 rounded-xl bg-nutrition px-4 py-2.5 font-display text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? t.common.saving : t.nutrition.onboarding.finishButton}
          </button>
        )}
      </div>

      <p className="text-center text-xs text-ink-faint">
        {t.nutrition.onboarding.stepLabel} {step + 1} {t.nutrition.onboarding.stepOfLabel} {TOTAL_STEPS}
      </p>
    </div>
  );
}
