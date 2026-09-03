"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Exercise } from "@/generated/prisma/client";
import { cn } from "@/lib/cn";
import type { Dictionary } from "@/lib/i18n";
import { completeOnboarding } from "./actions";
import { Step0Welcome } from "./steps/Step0Welcome";
import { Step1About } from "./steps/Step1About";
import { Step2Goal } from "./steps/Step2Goal";
import { Step3Availability } from "./steps/Step3Availability";
import { Step4Equipment } from "./steps/Step4Equipment";
import { Step5Preferences } from "./steps/Step5Preferences";
import { Step6Limitations } from "./steps/Step6Limitations";
import { INITIAL_ONBOARDING_DATA, type OnboardingData } from "./types";

const TOTAL_STEPS = 7;

export function OnboardingWizard({
  exercises,
  t,
}: {
  exercises: (Exercise & { category: { name: string } | null })[];
  t: Dictionary;
}) {
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
        return Boolean(data.age && data.sex && data.heightCm && data.weightKg && data.weightGoalKg && data.level);
      case 2:
        return Boolean(data.primaryGoal);
      case 3:
        return data.trainingDays.length > 0;
      case 4:
        return data.equipment.length > 0;
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

  function handleFinish() {
    setError(null);
    startTransition(async () => {
      try {
        await completeOnboarding(data);
        router.push("/fitness");
        router.refresh();
      } catch {
        setError(t.fitness.onboarding.genericError);
      }
    });
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-md flex-col justify-center gap-6 px-4 py-10">
      {step > 0 && (
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS - 1 }).map((_, i) => (
            <div key={i} className={cn("h-1 flex-1 rounded-full", i < step ? "bg-fitness" : "bg-border-soft")} />
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-border-soft bg-surface p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.15)]">
        {step === 0 && <Step0Welcome t={t} />}
        {step === 1 && <Step1About data={data} update={update} t={t} />}
        {step === 2 && <Step2Goal data={data} update={update} t={t} />}
        {step === 3 && <Step3Availability data={data} update={update} t={t} />}
        {step === 4 && <Step4Equipment data={data} update={update} t={t} />}
        {step === 5 && <Step5Preferences data={data} update={update} exercises={exercises} t={t} />}
        {step === 6 && <Step6Limitations data={data} update={update} t={t} />}
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
        {step === 0 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 rounded-xl bg-fitness px-4 py-2.5 font-display text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            {t.fitness.onboarding.start}
          </button>
        ) : step < TOTAL_STEPS - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canAdvance}
            className="flex-1 rounded-xl bg-fitness px-4 py-2.5 font-display text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-40"
          >
            {t.common.next}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            disabled={isPending}
            className="flex-1 rounded-xl bg-fitness px-4 py-2.5 font-display text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? t.fitness.onboarding.finishPending : t.fitness.onboarding.finishSubmit}
          </button>
        )}
      </div>

      {step > 0 && (
        <p className="text-center text-xs text-ink-faint">
          {t.fitness.onboarding.stepIndicatorPrefix} {step} {t.fitness.common.of} {TOTAL_STEPS - 1}
        </p>
      )}
    </div>
  );
}
