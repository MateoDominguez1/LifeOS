import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card, CardLabel } from "@/components/ui/card";
import { FitnessNav } from "@/components/fitness/fitness-nav";
import { getT } from "@/lib/i18n";
import { NewProfileForm } from "./NewProfileForm";

export default async function PeoplePage() {
  const [userId, { t }] = await Promise.all([requireUserId(), getT()]);

  const profiles = await prisma.managedProfile.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "asc" } });

  return (
    <div>
      <FitnessNav />

      <h1 className="mb-1 font-display text-xl font-bold text-ink">{t.fitness.people.title}</h1>
      <p className="mb-4 text-sm text-ink-soft">{t.fitness.people.subtitle}</p>

      <Card className="mb-4">
        <CardLabel>{t.fitness.people.addPersonLabel}</CardLabel>
        <div className="mt-3">
          <NewProfileForm t={t} />
        </div>
      </Card>

      {profiles.length === 0 ? (
        <p className="text-sm text-ink-soft">{t.fitness.people.empty}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {profiles.map((p) => (
            <Link key={p.id} href={`/fitness/people/${p.id}`}>
              <Card className="flex items-center justify-between transition-colors hover:bg-surface-raised">
                <div>
                  <div className="text-sm font-medium text-ink">{p.name}</div>
                  {p.relationship && <div className="text-xs text-ink-faint">{p.relationship}</div>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
