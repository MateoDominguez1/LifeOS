"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/money/format";

export type CategoryDatum = { categoryId: string; name: string; icon: string; color: string; amount: number };

export function CategoryBreakdownChart({ data }: { data: CategoryDatum[] }) {
  const sorted = [...data].sort((a, b) => b.amount - a.amount);
  const height = Math.max(sorted.length * 40, 120);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 4 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tickFormatter={(_value, index) => `${sorted[index]?.icon ?? ""} ${sorted[index]?.name ?? ""}`}
          tick={{ fill: "var(--ink-faint)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--border-soft)" }}
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 13 }}
        />
        <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={16}>
          {sorted.map((entry) => (
            <Cell key={entry.categoryId} fill={entry.color} />
          ))}
          <LabelList dataKey="amount" position="right" formatter={(value: unknown) => formatCurrency(Number(value))} style={{ fill: "var(--ink)", fontSize: 12 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
