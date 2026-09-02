export interface WeightTrendEntry {
  weightKg: number;
  loggedAt: Date;
}

export interface WeightTrend {
  latest: number;
  weeklyAverage: number;
  direction: "up" | "down" | "stable" | null;
  changeSincePriorWeek: number | null;
}

export function computeWeightTrend(entries: WeightTrendEntry[]): WeightTrend | null {
  if (entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => b.loggedAt.getTime() - a.loggedAt.getTime());
  const latest = sorted[0].weightKg;

  const oneWeekAgo = new Date(sorted[0].loggedAt);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(sorted[0].loggedAt);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const lastWeek = entries.filter((e) => e.loggedAt >= oneWeekAgo);
  const priorWeek = entries.filter((e) => e.loggedAt >= twoWeeksAgo && e.loggedAt < oneWeekAgo);

  const weeklyAverage = lastWeek.length > 0 ? lastWeek.reduce((s, e) => s + e.weightKg, 0) / lastWeek.length : latest;

  if (priorWeek.length === 0) {
    return { latest, weeklyAverage, direction: null, changeSincePriorWeek: null };
  }

  const priorAverage = priorWeek.reduce((s, e) => s + e.weightKg, 0) / priorWeek.length;
  const change = weeklyAverage - priorAverage;
  const direction = Math.abs(change) < 0.2 ? "stable" : change > 0 ? "up" : "down";

  return { latest, weeklyAverage, direction, changeSincePriorWeek: change };
}
