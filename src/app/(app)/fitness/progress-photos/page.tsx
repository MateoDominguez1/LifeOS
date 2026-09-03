import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { FitnessNav } from "@/components/fitness/fitness-nav";
import { getT } from "@/lib/i18n";
import { PhotoCard } from "./PhotoCard";
import { UploadPhotoForm } from "./UploadPhotoForm";

export default async function ProgressPhotosPage() {
  const [userId, { t }] = await Promise.all([requireUserId(), getT()]);

  const photos = await prisma.progressPhoto.findMany({
    where: { userId, managedProfileId: null },
    orderBy: { takenAt: "desc" },
  });

  return (
    <div>
      <FitnessNav />

      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-ink">{t.fitness.progressPhotos.title}</h1>
        {photos.length >= 2 && (
          <Link href="/fitness/progress-photos/compare" className="text-sm font-medium text-fitness underline underline-offset-2">
            {t.fitness.progressPhotos.compare}
          </Link>
        )}
      </div>

      <Card className="mb-4">
        <UploadPhotoForm t={t} />
      </Card>

      {photos.length === 0 ? (
        <p className="text-sm text-ink-soft">{t.fitness.progressPhotos.empty}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
