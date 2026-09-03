import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { FitnessNav } from "@/components/fitness/fitness-nav";
import { getT } from "@/lib/i18n";
import { CompareView } from "./CompareView";

export default async function ComparePhotosPage() {
  const [userId, { t }] = await Promise.all([requireUserId(), getT()]);

  const photos = await prisma.progressPhoto.findMany({
    where: { userId, managedProfileId: null },
    orderBy: { takenAt: "desc" },
    select: { id: true, angle: true, takenAt: true, weightKgAtTime: true },
  });

  return (
    <div>
      <FitnessNav />
      <h1 className="mb-4 font-display text-xl font-bold text-ink">{t.fitness.progressPhotos.compareTitle}</h1>
      <CompareView photos={photos.map((p) => ({ ...p, takenAt: p.takenAt.toISOString() }))} t={t} />
    </div>
  );
}
