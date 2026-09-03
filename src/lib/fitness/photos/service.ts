import { randomUUID } from "node:crypto";
import type { PhotoAngle } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getT } from "@/lib/i18n";
import { storage } from "../storage";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

type ServiceResult = { success: true; photoId: string } | { error: string };
type SimpleResult = { success: true } | { error: string };

interface UploadableFile {
  size: number;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export async function uploadPhoto(
  userId: string,
  file: UploadableFile,
  angle: string,
  notes: string | undefined,
  managedProfileId: string | null = null
): Promise<ServiceResult> {
  if (file.size === 0) {
    const { t } = await getT();
    return { error: t.fitness.progressPhotos.chooseFileError };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    const { t } = await getT();
    return { error: t.fitness.progressPhotos.invalidTypeError };
  }
  if (file.size > MAX_SIZE_BYTES) {
    const { t } = await getT();
    return { error: t.fitness.progressPhotos.tooLargeError };
  }
  if (angle !== "FRONT" && angle !== "SIDE" && angle !== "BACK") {
    const { t } = await getT();
    return { error: t.fitness.progressPhotos.invalidAngleError };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const key = `photos/${userId}/${randomUUID()}.${ext}`;

  await storage.upload(key, buffer, file.type);

  const latestWeight = await prisma.weightEntry.findFirst({
    where: { userId, managedProfileId },
    orderBy: { loggedAt: "desc" },
  });

  const photo = await prisma.progressPhoto.create({
    data: {
      userId,
      managedProfileId,
      storageKey: key,
      angle: angle as PhotoAngle,
      notes: notes?.trim() || null,
      weightKgAtTime: latestWeight?.weightKg,
    },
  });

  return { success: true, photoId: photo.id };
}

export async function deletePhoto(userId: string, photoId: string): Promise<SimpleResult> {
  const photo = await prisma.progressPhoto.findUnique({ where: { id: photoId } });
  if (!photo || photo.userId !== userId) {
    const { t } = await getT();
    return { error: t.fitness.common.notAuthorizedError };
  }

  await storage.delete(photo.storageKey);
  await prisma.progressPhoto.delete({ where: { id: photoId } });
  return { success: true };
}

export async function setPhotoPrivacy(userId: string, photoId: string, privacy: "PRIVATE" | "PEOPLE" | "PUBLIC"): Promise<SimpleResult> {
  const photo = await prisma.progressPhoto.findUnique({ where: { id: photoId } });
  if (!photo || photo.userId !== userId) {
    const { t } = await getT();
    return { error: t.fitness.common.notAuthorizedError };
  }

  await prisma.progressPhoto.update({ where: { id: photoId }, data: { privacy } });
  return { success: true };
}
