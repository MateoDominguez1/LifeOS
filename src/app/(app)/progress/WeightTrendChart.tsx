"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Dictionary } from "@/lib/i18n";

export function WeightTrendChart({ data, t }: { data: { date: string; weightKg: number }[]; t: Dictionary }) {
  if (data.length < 2) {
    return <p className="py-6 text-center text-sm text-ink-faint">{t.progress.weightChartEmpty}</p>;
  }
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fill: "var(--ink-faint)", fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} axisLine={false} tickLine={false} />
          <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={{ fill: "var(--ink-faint)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v) => [`${v} kg`, t.progress.weightTooltipLabel]}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 13 }}
          />
          <Line type="monotone" dataKey="weightKg" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
