import Link from "next/link";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { NutritionNav } from "@/components/nutrition/nutrition-nav";
import { requireUserId } from "@/lib/auth/session";
import { getMonthlyHistory, type Compliance } from "@/lib/nutrition/history/getMonthlyHistory";
import { getT } from "@/lib/i18n";
import { dateFnsLocales } from "@/lib/i18n/date-fns-locale";

const COMPLIANCE_EMOJI: Record<Compliance, string> = {
  green: "🟢",
  yellow: "🟡",
  red: "🔴",
  none: "",
};

export default async function NutritionHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const [userId, { locale, t }] = await Promise.all([requireUserId(), getT()]);

  const params = await searchParams;
  const now = new Date();
  const year = params.year ? Number(params.year) : now.getFullYear();
  const month = params.month ? Number(params.month) : now.getMonth();

  const days = await getMonthlyHistory(userId, year, month);

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const leadingBlanks = Array.from({ length: firstWeekday });

  const prevMonth = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const nextMonth = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };

  const daysWithData = days.filter((d) => d.compliance !== "none");
  const daysOnTarget = daysWithData.filter((d) => d.compliance === "green").length;
  const complianceRate = daysWithData.length > 0 ? Math.round((daysOnTarget / daysWithData.length) * 100) : null;

  const weekdayLabels = [
    t.weekdaysShort.mon,
    t.weekdaysShort.tue,
    t.weekdaysShort.wed,
    t.weekdaysShort.thu,
    t.weekdaysShort.fri,
    t.weekdaysShort.sat,
    t.weekdaysShort.sun,
  ];
  const monthLabel = format(new Date(year, month, 1), "MMMM yyyy", { locale: dateFnsLocales[locale] });

  return (
    <div>
      <NutritionNav />

      <h1 className="mb-4 font-display text-xl font-bold text-ink">{t.nutrition.history.title}</h1>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Link
            href={`/nutrition/history?year=${prevMonth.year}&month=${prevMonth.month}`}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-ink"
          >
            ←
          </Link>
          <span className="font-display text-sm font-medium capitalize text-ink">{monthLabel}</span>
          <Link
            href={`/nutrition/history?year=${nextMonth.year}&month=${nextMonth.month}`}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-ink"
          >
            →
          </Link>
        </div>

        {complianceRate != null && (
          <p className="text-center text-sm text-ink-soft">
            {t.nutrition.history.complianceLabel} <strong>{complianceRate}%</strong> ({daysOnTarget}/{daysWithData.length} {t.nutrition.history.daysUnit})
          </p>
        )}

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink-faint">
          {weekdayLabels.map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {leadingBlanks.map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {days.map((day) => (
            <div
              key={day.date.toISOString()}
              className="flex aspect-square flex-col items-center justify-center rounded-lg border border-border-soft text-xs"
            >
              <span className="text-ink-soft">{day.date.getDate()}</span>
              {day.compliance !== "none" && (
                <>
                  <span>{COMPLIANCE_EMOJI[day.compliance]}</span>
                  <span className="text-[10px] text-ink-faint">{Math.round(day.totalCalories)}</span>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4 text-xs text-ink-faint">
          <span>🟢 {t.nutrition.history.onTarget}</span>
          <span>🟡 {t.nutrition.history.close}</span>
          <span>🔴 {t.nutrition.history.far}</span>
        </div>
      </Card>
    </div>
  );
}
