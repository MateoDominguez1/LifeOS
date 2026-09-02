"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tooltipStyle = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 13 };
const axisTick = { fill: "var(--ink-faint)", fontSize: 10 };

export function WeightChart({ data }: { data: { date: string; weightKg: number }[] }) {
  if (data.length < 2) {
    return <p className="py-6 text-center text-sm text-ink-faint">Registrá tu peso al menos dos veces para ver la evolución.</p>;
  }
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="date" tick={axisTick} tickFormatter={(v: string) => v.slice(5)} axisLine={false} tickLine={false} />
          <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={axisTick} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => [`${v} kg`, "Peso"]} contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="weightKg" stroke="var(--fitness)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MeasurementChart({ data }: { data: { date: string; valueCm: number }[] }) {
  if (data.length < 2) {
    return <p className="py-4 text-center text-xs text-ink-faint">Registrá más mediciones para ver la evolución.</p>;
  }
  return (
    <div className="h-28 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="date" tick={axisTick} tickFormatter={(v: string) => v.slice(5)} axisLine={false} tickLine={false} />
          <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={axisTick} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => [`${v} cm`, "Medida"]} contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="valueCm" stroke="var(--accent)" strokeWidth={2} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StrengthChart({ data }: { data: { date: string; estimated1RM: number }[] }) {
  if (data.length < 2) {
    return <p className="py-4 text-center text-xs text-ink-faint">Entrená este ejercicio un poco más para ver la evolución.</p>;
  }
  return (
    <div className="h-28 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="date" tick={axisTick} tickFormatter={(v: string) => v.slice(5)} axisLine={false} tickLine={false} />
          <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={axisTick} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => [`${v} kg`, "1RM est."]} contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="estimated1RM" stroke="var(--fitness)" strokeWidth={2} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VolumeChart({ data }: { data: { week: string; volume: number }[] }) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-ink-faint">Completá entrenamientos para ver el volumen semanal.</p>;
  }
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="var(--border-soft)" vertical={false} />
          <XAxis dataKey="week" tick={axisTick} tickFormatter={(v: string) => v.slice(5)} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => [`${v} kg`, "Volumen"]} contentStyle={tooltipStyle} />
          <Bar dataKey="volume" fill="var(--fitness)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FrequencyChart({ data }: { data: { week: string; count: number }[] }) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-ink-faint">Completá entrenamientos para ver tu frecuencia.</p>;
  }
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="var(--border-soft)" vertical={false} />
          <XAxis dataKey="week" tick={axisTick} tickFormatter={(v: string) => v.slice(5)} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip formatter={(v) => [v, "Sesiones"]} contentStyle={tooltipStyle} />
          <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MuscleGroupChart({ data }: { data: { muscle: string; volume: number }[] }) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-ink-faint">Completá entrenamientos para ver el volumen por grupo muscular.</p>;
  }
  const height = Math.max(120, data.length * 28);
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 10, bottom: 4 }}>
          <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="muscle" tick={axisTick} axisLine={false} tickLine={false} width={80} />
          <Tooltip formatter={(v) => [`${v} kg`, "Volumen"]} contentStyle={tooltipStyle} />
          <Bar dataKey="volume" fill="var(--fitness)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
