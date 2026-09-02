"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function WeightChart({ data }: { data: { date: string; weightKg: number }[] }) {
  if (data.length < 2) {
    return <p className="py-8 text-center text-sm text-ink-faint">Registrá tu peso al menos dos veces para ver la evolución.</p>;
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fill: "var(--ink-faint)", fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} axisLine={false} tickLine={false} />
          <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={{ fill: "var(--ink-faint)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value) => [`${value} kg`, "Peso"]}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 13 }}
          />
          <Line type="monotone" dataKey="weightKg" stroke="var(--nutrition)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
