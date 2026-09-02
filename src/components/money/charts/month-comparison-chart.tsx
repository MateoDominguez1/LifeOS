"use client";

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/money/format";

export type ComparisonDatum = { label: string; amount: number };

export function MonthComparisonChart({ data }: { data: ComparisonDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 20, right: 8, bottom: 4, left: 8 }}>
        <XAxis dataKey="label" tick={{ fill: "var(--ink-faint)", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip
          cursor={{ fill: "var(--border-soft)" }}
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 13 }}
        />
        <Bar dataKey="amount" fill="var(--accent)" radius={[4, 4, 0, 0]} barSize={48}>
          <LabelList dataKey="amount" position="top" formatter={(value: unknown) => formatCurrency(Number(value))} style={{ fill: "var(--ink)", fontSize: 12, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
