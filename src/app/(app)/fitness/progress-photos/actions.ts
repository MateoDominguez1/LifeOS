"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth/session";
import * as photoService from "@/lib/fitness/photos/service";

export interface UploadPhotoState {
  error?: string;
}

export async function uploadPhoto(_prev: UploadPhotoState, formData: FormData): Promise<UploadPhotoState> {
  const userId = await requireUserId();

  const file = formData.get("file");
  const angle = String(formData.get("angle") ?? "FRONT");
  const notes = formData.get("notes");

  if (!(file instanceof File)) {
    return { error: "Choose a photo to upload" };
  }

  const result = await photoService.uploadPhoto(userId, file, angle, notes ? String(notes) : undefined);
  if ("error" in result) return { error: result.error };

  revalidatePath("/fitness/progress-photos");
  return {};
}

export async function deletePhoto(photoId: string) {
  const userId = await requireUserId();
  const result = await photoService.deletePhoto(userId, photoId);
  if ("error" in result) throw new Error(result.error);
  revalidatePath("/fitness/progress-photos");
}

export async function setPhotoPrivacy(photoId: string, privacy: "PRIVATE" | "PEOPLE" | "PUBLIC") {
  const userId = await requireUserId();
  const result = await photoService.setPhotoPrivacy(userId, photoId, privacy);
  if ("error" in result) throw new Error(result.error);
  revalidatePath("/fitness/progress-photos");
}
