import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { MoneyNav } from "@/components/money/money-nav";
import { Card, CardLabel } from "@/components/ui/card";
import { getUpcomingImportantDates } from "@/lib/money/getUpcomingImportantDates";
import { deleteImportantDateAction, toggleImportantDateActiveAction } from "./actions";

const TYPE_LABEL: Record<string, string> = {
  BIRTHDAY: "🎂 Cumpleaños",
  ANNIVERSARY: "💍 Aniversario",
  OTHER: "📌 Otro",
};

export default async function ImportantDatesPage() {
  const userId = await requireUserId();
  const dates = await prisma.importantDate.findMany({ where: { userId }, orderBy: { date: "asc" } });
  const upcomingByDate = new Map(
    getUpcomingImportantDates(dates, new Date(), 366).map((u) => [u.id, u])
  );

  return (
    <div>
      <MoneyNav />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-xl font-bold">Fechas importantes</h1>
        <Link
          href="/money/important-dates/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 font-display text-sm font-medium text-white hover:opacity-90"
        >
          <Plus size={15} /> Nueva fecha
        </Link>
      </div>

      {dates.length === 0 ? (
        <Card className="py-10 text-center text-sm text-ink-soft">
          Todavía no agregaste fechas importantes.
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {dates.map((d) => {
            const upcoming = upcomingByDate.get(d.id);
            return (
              <Card key={d.id} domain={d.isActive ? "accent" : "neutral"} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-ink">
                    {d.personName}
                    {d.relationship && <span className="text-sm text-ink-faint">({d.relationship})</span>}
                  </div>
                  <CardLabel className="mt-1">
                    {TYPE_LABEL[d.type]} ·{" "}
                    {d.date.toLocaleDateString("es-AR", { day: "numeric", month: "long" })}
                    {upcoming && d.isActive ? ` · ${upcoming.daysUntil === 0 ? "hoy" : upcoming.daysUntil === 1 ? "mañana" : `en ${upcoming.daysUntil} días`}` : ""}
                  </CardLabel>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Link
                    href={`/money/important-dates/${d.id}/edit`}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-ink-faint hover:bg-surface-raised hover:text-ink"
                  >
                    Editar
                  </Link>
                  <form action={toggleImportantDateActiveAction.bind(null, d.id)}>
                    <button
                      type="submit"
                      className="rounded-lg px-2 py-1 text-xs font-medium text-ink-faint hover:bg-surface-raised hover:text-ink"
                    >
                      {d.isActive ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                  <form action={deleteImportantDateAction.bind(null, d.id)}>
                    <button
                      type="submit"
                      className="rounded-lg px-2 py-1 text-xs font-medium text-ink-faint hover:bg-danger-soft hover:text-danger"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
