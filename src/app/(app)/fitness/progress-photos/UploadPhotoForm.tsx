"use client";

import { useActionState, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { uploadPhoto, type UploadPhotoState } from "./actions";

const initialState: UploadPhotoState = {};

export function UploadPhotoForm({ t }: { t: Dictionary }) {
  const [state, formAction, pending] = useActionState(uploadPhoto, initialState);
  const [angle, setAngle] = useState<"FRONT" | "SIDE" | "BACK">("FRONT");
  const [preview, setPreview] = useState<string | null>(null);

  const ANGLES = [
    { value: "FRONT", label: t.fitness.progressPhotos.angleFront },
    { value: "SIDE", label: t.fitness.progressPhotos.angleSide },
    { value: "BACK", label: t.fitness.progressPhotos.angleBack },
  ] as const;

  return (
    <form action={formAction} className="space-y-3">
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={t.fitness.progressPhotos.previewAlt} className="h-48 w-full rounded-xl object-cover" />
      )}

      <input type="hidden" name="angle" value={angle} />
      <div className="grid grid-cols-3 gap-2">
        {ANGLES.map((a) => (
          <button
            key={a.value}
            type="button"
            onClick={() => setAngle(a.value)}
            className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
              angle === a.value ? "border-fitness bg-fitness-soft text-fitness" : "border-border text-ink-soft"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      <input
        type="file"
        name="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) setPreview(URL.createObjectURL(file));
        }}
        className="block w-full text-sm text-ink-soft"
      />

      <textarea
        name="notes"
        rows={2}
        placeholder={t.fitness.progressPhotos.notesPlaceholder}
        className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-sm text-ink"
      />

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <button type="submit" disabled={pending} className="rounded-xl bg-fitness px-4 py-2.5 font-display text-sm font-medium text-white disabled:opacity-60">
        {pending ? t.fitness.common.uploading : t.fitness.progressPhotos.uploadSubmit}
      </button>
    </form>
  );
}
