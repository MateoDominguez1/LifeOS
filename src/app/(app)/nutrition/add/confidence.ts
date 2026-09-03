export interface ConfidenceLabels {
  noMatch: string;
  high: string;
  medium: string;
  low: string;
}

export function confidenceLabel(
  confidence: number | null,
  labels: ConfidenceLabels
): {
  label: string;
  className: string;
} {
  if (confidence == null) {
    return { label: labels.noMatch, className: "bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300" };
  }
  if (confidence >= 80) {
    return { label: `${labels.high} · ${Math.round(confidence)}%`, className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" };
  }
  if (confidence >= 50) {
    return { label: `${labels.medium} · ${Math.round(confidence)}%`, className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400" };
  }
  return { label: `${labels.low} · ${Math.round(confidence)}%`, className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" };
}

export function inferMealType(date = new Date()): "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return "BREAKFAST";
  if (hour >= 11 && hour < 15) return "LUNCH";
  if (hour >= 15 && hour < 19) return "SNACK";
  if (hour >= 19 && hour < 23) return "DINNER";
  return "SNACK";
}
