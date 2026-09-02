import type { ExperienceLevel } from "@/generated/prisma/client";

export interface DayTemplate {
  label: string;
  categories: string[];
}

const PUSH: DayTemplate = { label: "Push", categories: ["Chest", "Shoulders", "Triceps"] };
const PULL: DayTemplate = { label: "Pull", categories: ["Back", "Biceps"] };
const LEGS: DayTemplate = { label: "Legs", categories: ["Quads", "Hamstrings", "Glutes", "Calves"] };
const UPPER: DayTemplate = { label: "Upper", categories: ["Chest", "Back", "Shoulders", "Biceps", "Triceps"] };
const LOWER: DayTemplate = { label: "Lower", categories: ["Quads", "Hamstrings", "Glutes", "Calves"] };
const FULL_BODY: DayTemplate = { label: "Full Body", categories: ["Chest", "Back", "Quads", "Shoulders", "Core"] };

export function getSplitTemplate(daysPerWeek: number, level: ExperienceLevel | null): DayTemplate[] {
  const days = Math.min(Math.max(daysPerWeek, 1), 6);

  if (days <= 2) return Array.from({ length: days }, () => FULL_BODY);
  if (days === 3) return level === "BEGINNER" ? [FULL_BODY, FULL_BODY, FULL_BODY] : [PUSH, PULL, LEGS];
  if (days === 4) return [UPPER, LOWER, UPPER, LOWER];
  if (days === 5) return [PUSH, PULL, LEGS, UPPER, LOWER];
  return [PUSH, PULL, LEGS, PUSH, PULL, LEGS];
}
