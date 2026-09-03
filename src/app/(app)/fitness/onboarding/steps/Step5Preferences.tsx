"use client";

import { useState } from "react";
import type { Exercise } from "@/generated/prisma/client";
import type { OnboardingData } from "../types";
import { Chip, Field, StepShell, TextInput } from "@/components/fitness/form";
import type { Dictionary } from "@/lib/i18n";

const MUSCLES = ["chest", "back", "shoulders", "biceps", "triceps", "quads", "hamstrings", "glutes", "calves", "core"];

export function Step5Preferences({
  data,
  update,
  exercises,
  t,
}: {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  exercises: (Exercise & { category: { name: string } | null })[];
  t: Dictionary;
}) {
  const [query, setQuery] = useState("");

  const MUSCLE_LABELS: Record<string, string> = {
    chest: t.fitness.onboarding.muscleChest,
    back: t.fitness.onboarding.muscleBack,
    shoulders: t.fitness.onboarding.muscleShoulders,
    biceps: t.fitness.onboarding.muscleBiceps,
    triceps: t.fitness.onboarding.muscleTriceps,
    quads: t.fitness.onboarding.muscleQuads,
    hamstrings: t.fitness.onboarding.muscleHamstrings,
    glutes: t.fitness.onboarding.muscleGlutes,
    calves: t.fitness.onboarding.muscleCalves,
    core: t.fitness.onboarding.muscleCore,
  };

  const filtered = query.trim()
    ? exercises.filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 30)
    : exercises.slice(0, 30);

  function toggleFavorite(id: string) {
    const isFav = data.favoriteExerciseIds.includes(id);
    update({
      favoriteExerciseIds: isFav ? data.favoriteExerciseIds.filter((x) => x !== id) : [...data.favoriteExerciseIds, id],
      excludedExerciseIds: data.excludedExerciseIds.filter((x) => x !== id),
    });
  }

  function toggleExcluded(id: string) {
    const isExcl = data.excludedExerciseIds.includes(id);
    update({
      excludedExerciseIds: isExcl ? data.excludedExerciseIds.filter((x) => x !== id) : [...data.excludedExerciseIds, id],
      favoriteExerciseIds: data.favoriteExerciseIds.filter((x) => x !== id),
    });
  }

  return (
    <StepShell title={t.fitness.onboarding.step5Title} subtitle={t.fitness.onboarding.step5Subtitle}>
      <Field label={t.fitness.onboarding.priorityMusclesLabel}>
        <div className="grid grid-cols-2 gap-2">
          {MUSCLES.map((m) => (
            <Chip
              key={m}
              label={MUSCLE_LABELS[m]}
              selected={data.priorityMuscles.includes(m)}
              onClick={() =>
                update({
                  priorityMuscles: data.priorityMuscles.includes(m)
                    ? data.priorityMuscles.filter((x) => x !== m)
                    : [...data.priorityMuscles, m],
                })
              }
            />
          ))}
        </div>
      </Field>

      <Field label={t.fitness.onboarding.cardioLabel}>
        <div className="grid grid-cols-2 gap-2">
          <Chip label={t.common.yes} selected={data.cardioPreference} onClick={() => update({ cardioPreference: true })} />
          <Chip label={t.common.no} selected={!data.cardioPreference} onClick={() => update({ cardioPreference: false })} />
        </div>
      </Field>

      <Field label={t.fitness.onboarding.rirRpeLabel}>
        <div className="grid grid-cols-3 gap-2">
          <Chip label="RIR" selected={data.rirRpeMode === "RIR"} onClick={() => update({ rirRpeMode: "RIR" })} />
          <Chip label="RPE" selected={data.rirRpeMode === "RPE"} onClick={() => update({ rirRpeMode: "RPE" })} />
          <Chip label={t.fitness.onboarding.rirRpeNone} selected={data.rirRpeMode === "NONE"} onClick={() => update({ rirRpeMode: "NONE" })} />
        </div>
      </Field>

      <Field label={t.fitness.onboarding.favoriteExercisesLabel}>
        <TextInput type="text" placeholder={t.fitness.onboarding.searchExercisesPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
          {filtered.map((ex) => {
            const isFav = data.favoriteExerciseIds.includes(ex.id);
            const isExcl = data.excludedExerciseIds.includes(ex.id);
            return (
              <div key={ex.id} className="flex items-center justify-between gap-2 rounded-lg border border-border-soft px-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-ink">{ex.name}</div>
                  <div className="text-xs text-ink-faint">{ex.category?.name}</div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(ex.id)}
                    className={`rounded-lg px-2 py-1 text-sm ${isFav ? "bg-fitness-soft text-fitness" : "text-ink-faint hover:bg-surface-raised"}`}
                  >
                    ♥
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleExcluded(ex.id)}
                    className={`rounded-lg px-2 py-1 text-sm ${isExcl ? "bg-danger-soft text-danger" : "text-ink-faint hover:bg-surface-raised"}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Field>
    </StepShell>
  );
}
