import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card, CardLabel } from "@/components/ui/card";
import { FitnessNav } from "@/components/fitness/fitness-nav";
import { getT } from "@/lib/i18n";
import { WeightChart } from "../../progress/charts";
import { QuickAddManagedMeasurement, QuickAddManagedWeight } from "./QuickForms";
import { DeleteProfileButton } from "./DeleteProfileButton";

export default async function ManagedProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [userId, { t }] = await Promise.all([requireUserId(), getT()]);
  const { id } = await params;

  const profile = await prisma.managedProfile.findUnique({ where: { id } });
  if (!profile || profile.ownerId !== userId) notFound();

  const [weightEntries, measurements, records] = await Promise.all([
    prisma.weightEntry.findMany({ where: { managedProfileId: id }, orderBy: { loggedAt: "asc" } }),
    prisma.bodyMeasurement.findMany({ where: { managedProfileId: id }, orderBy: { loggedAt: "desc" }, take: 10 }),
    prisma.personalRecord.findMany({ where: { managedProfileId: id }, include: { exercise: true }, orderBy: { achievedAt: "desc" }, take: 10 }),
  ]);

  const weightSeries = weightEntries.map((w) => ({ date: w.loggedAt.toISOString().slice(0, 10), weightKg: w.weightKg }));
  const latestWeight = weightSeries.length > 0 ? weightSeries[weightSeries.length - 1].weightKg : null;

  return (
    <div>
      <FitnessNav />

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">❤️ {profile.name}</h1>
          {profile.relationship && <p className="text-sm text-ink-soft">{profile.relationship}</p>}
        </div>
        <DeleteProfileButton id={profile.id} t={t} />
      </div>

      <div className="flex flex-col gap-4">
        <Card domain="fitness">
          <div className="flex items-center justify-between">
            <CardLabel>{t.fitness.people.weightLabel}</CardLabel>
            <QuickAddManagedWeight managedProfileId={id} t={t} />
          </div>
          {latestWeight != null ? (
            <div className="mt-2 font-display text-2xl font-bold text-ink">{latestWeight} kg</div>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">{t.fitness.people.noWeightLogged}</p>
          )}
          <div className="mt-3">
            <WeightChart data={weightSeries} t={t} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <CardLabel>{t.fitness.people.measurementsLabel}</CardLabel>
            <QuickAddManagedMeasurement managedProfileId={id} t={t} />
          </div>
          {measurements.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">{t.fitness.people.noMeasurementsLogged}</p>
          ) : (
            <div className="mt-2 space-y-1">
              {measurements.map((m) => (
                <div key={m.id} className="flex justify-between text-sm">
                  <span className="text-ink">{m.type === "CUSTOM" ? m.customLabel ?? t.measurementTypes.CUSTOM : t.measurementTypes[m.type]}</span>
                  <span className="text-ink-soft">
                    {m.valueCm} cm · {m.loggedAt.toISOString().slice(0, 10)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardLabel>{t.fitness.people.recordsLabel}</CardLabel>
          {records.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">{t.fitness.people.noRecordsLogged}</p>
          ) : (
            <div className="mt-2 space-y-1">
              {records.map((r) => (
                <div key={r.id} className="flex justify-between text-sm">
                  <span className="text-ink">{r.exercise.name}</span>
                  <span className="text-ink-soft">{Math.round(r.value * 10) / 10}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
