"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";

export interface ComparePhoto {
  id: string;
  angle: string;
  takenAt: string;
  weightKgAtTime: number | null;
}

export function CompareView({ photos, t }: { photos: ComparePhoto[]; t: Dictionary }) {
  const ANGLES = [
    { value: "FRONT", label: t.fitness.progressPhotos.angleFront },
    { value: "SIDE", label: t.fitness.progressPhotos.angleSide },
    { value: "BACK", label: t.fitness.progressPhotos.angleBack },
  ] as const;

  const [angle, setAngle] = useState<string>(photos[0]?.angle ?? "FRONT");
  const [beforeId, setBeforeId] = useState<string | undefined>(undefined);
  const [afterId, setAfterId] = useState<string | undefined>(undefined);

  const filtered = useMemo(() => photos.filter((p) => p.angle === angle), [photos, angle]);

  const before = filtered.find((p) => p.id === beforeId) ?? filtered[filtered.length - 1];
  const after = filtered.find((p) => p.id === afterId) ?? filtered[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {ANGLES.map((a) => (
          <button
            key={a.value}
            type="button"
            onClick={() => {
              setAngle(a.value);
              setBeforeId(undefined);
              setAfterId(undefined);
            }}
            className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
              angle === a.value ? "border-fitness bg-fitness-soft text-fitness" : "border-border text-ink-soft"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {filtered.length < 2 ? (
        <p className="text-sm text-ink-soft">
          {t.fitness.progressPhotos.needTwoPhotosPrefix} {ANGLES.find((a) => a.value === angle)?.label.toLowerCase()}{" "}
          {t.fitness.progressPhotos.needTwoPhotosSuffix}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: t.fitness.progressPhotos.before, photo: before, value: beforeId, onChange: setBeforeId },
            { label: t.fitness.progressPhotos.after, photo: after, value: afterId, onChange: setAfterId },
          ].map((side) => (
            <div key={side.label}>
              <select
                value={side.value ?? side.photo?.id}
                onChange={(e) => side.onChange(e.target.value)}
                className="mb-2 h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm text-ink"
              >
                {filtered.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.takenAt.slice(0, 10)}
                  </option>
                ))}
              </select>
              {side.photo && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/fitness/photos/${side.photo.id}`} alt={side.label} className="aspect-[3/4] w-full rounded-xl object-cover" />
                  {side.photo.weightKgAtTime != null && <p className="mt-1 text-xs text-ink-faint">{side.photo.weightKgAtTime} kg</p>}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-ink-faint">{t.fitness.progressPhotos.disclaimer}</p>
    </div>
  );
}
