"use client";

import { useTransition } from "react";
import type { Dictionary } from "@/lib/i18n";
import { deletePhoto, setPhotoPrivacy } from "./actions";

export interface PhotoCardData {
  id: string;
  angle: string;
  takenAt: Date;
  weightKgAtTime: number | null;
  notes: string | null;
  privacy: "PRIVATE" | "PEOPLE" | "PUBLIC";
}

export function PhotoCard({ photo, t }: { photo: PhotoCardData; t: Dictionary }) {
  const [isPending, startTransition] = useTransition();

  const ANGLE_LABEL: Record<string, string> = {
    FRONT: t.fitness.progressPhotos.angleFront,
    SIDE: t.fitness.progressPhotos.angleSide,
    BACK: t.fitness.progressPhotos.angleBack,
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border-soft">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/api/fitness/photos/${photo.id}`} alt={ANGLE_LABEL[photo.angle]} className="aspect-[3/4] w-full object-cover" />
      <div className="p-2.5">
        <div className="flex items-center justify-between text-xs text-ink-soft">
          <span>{ANGLE_LABEL[photo.angle]}</span>
          <span>{photo.takenAt.toISOString().slice(0, 10)}</span>
        </div>
        {photo.weightKgAtTime != null && <div className="mt-0.5 text-xs text-ink-faint">{photo.weightKgAtTime} kg</div>}
        {photo.notes && <p className="mt-1 text-xs text-ink-soft">{photo.notes}</p>}
        <div className="mt-2 flex items-center justify-between">
          <select
            defaultValue={photo.privacy}
            disabled={isPending}
            onChange={(e) => startTransition(() => setPhotoPrivacy(photo.id, e.target.value as "PRIVATE" | "PEOPLE" | "PUBLIC"))}
            className="h-7 rounded-lg border border-border bg-surface px-1.5 text-xs text-ink"
          >
            <option value="PRIVATE">{t.fitness.progressPhotos.privacyPrivate}</option>
            <option value="PEOPLE">{t.fitness.progressPhotos.privacyPeople}</option>
            <option value="PUBLIC">{t.fitness.progressPhotos.privacyPublic}</option>
          </select>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => deletePhoto(photo.id))}
            className="text-xs text-danger hover:underline"
          >
            {t.common.delete}
          </button>
        </div>
      </div>
    </div>
  );
}
