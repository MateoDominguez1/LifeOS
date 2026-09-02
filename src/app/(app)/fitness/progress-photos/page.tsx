import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { FitnessNav } from "@/components/fitness/fitness-nav";
import { PhotoCard } from "./PhotoCard";
import { UploadPhotoForm } from "./UploadPhotoForm";

export default async function ProgressPhotosPage() {
  const userId = await requireUserId();

  const photos = await prisma.progressPhoto.findMany({
    where: { userId, managedProfileId: null },
    orderBy: { takenAt: "desc" },
  });

  return (
    <div>
      <FitnessNav />

      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-ink">Fotos de progreso</h1>
        {photos.length >= 2 && (
          <Link href="/fitness/progress-photos/compare" className="text-sm font-medium text-fitness underline underline-offset-2">
            Comparar
          </Link>
        )}
      </div>

      <Card className="mb-4">
        <UploadPhotoForm />
      </Card>

      {photos.length === 0 ? (
        <p className="text-sm text-ink-soft">No hay fotos todavía. Son privadas por defecto — solo vos podés verlas.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} />
          ))}
        </div>
      )}
    </div>
  );
}
