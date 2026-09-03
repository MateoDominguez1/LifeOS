"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { compressImage } from "@/lib/nutrition/client/compressImage";
import type { Dictionary } from "@/lib/i18n";
import { analyzeMealDescription, analyzeMealPhoto } from "./actions";
import { ReviewMeal } from "./ReviewMeal";
import type { DraftMeal } from "./types";

type Stage =
  | { name: "idle" }
  | { name: "analyzing"; photoDataUrl?: string }
  | { name: "review"; photoDataUrl?: string; draft: DraftMeal }
  | { name: "error"; message: string };

export function AddMealFlow({ t }: { t: Dictionary }) {
  const [mode, setMode] = useState<"photo" | "describe">("photo");
  const [stage, setStage] = useState<Stage>({ name: "idle" });
  const [description, setDescription] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    try {
      const { base64, mimeType, dataUrl } = await compressImage(file);
      setStage({ name: "analyzing", photoDataUrl: dataUrl });
      const draft = await analyzeMealPhoto(base64, mimeType);
      setStage({ name: "review", photoDataUrl: dataUrl, draft });
    } catch (error) {
      console.error("Fallo el análisis de la foto:", error);
      setStage({
        name: "error",
        message: t.nutrition.addMeal.photoErrorFallback,
      });
    }
  }

  async function handleDescribe() {
    if (!description.trim()) return;
    try {
      setStage({ name: "analyzing" });
      const draft = await analyzeMealDescription(description);
      setStage({ name: "review", draft });
    } catch (error) {
      console.error("Fallo el análisis de la descripción:", error);
      setStage({
        name: "error",
        message: t.nutrition.addMeal.descriptionErrorFallback,
      });
    }
  }

  if (stage.name === "review") {
    return (
      <ReviewMeal
        photoDataUrl={stage.photoDataUrl}
        draft={stage.draft}
        onRestart={() => setStage({ name: "idle" })}
        t={t}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      {stage.name === "analyzing" && (
        <>
          {stage.photoDataUrl && (
            <Image
              src={stage.photoDataUrl}
              alt={t.nutrition.addMeal.photoAlt}
              width={224}
              height={224}
              unoptimized
              className="h-56 w-56 rounded-2xl object-cover"
            />
          )}
          <p className="animate-pulse font-display text-sm font-medium text-ink-soft">{t.nutrition.addMeal.analyzing}</p>
        </>
      )}

      {stage.name === "idle" && (
        <>
          <div className="text-5xl">{mode === "photo" ? "📸" : "✍️"}</div>
          <h1 className="font-display text-xl font-bold tracking-tight text-ink">{t.nutrition.addMeal.title}</h1>

          <div className="grid w-full grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("photo")}
              className={`rounded-xl border px-3 py-2 font-display text-sm font-medium transition-colors ${
                mode === "photo" ? "border-nutrition bg-nutrition-soft text-nutrition" : "border-border text-ink-soft"
              }`}
            >
              📸 {t.nutrition.addMeal.photoTab}
            </button>
            <button
              type="button"
              onClick={() => setMode("describe")}
              className={`rounded-xl border px-3 py-2 font-display text-sm font-medium transition-colors ${
                mode === "describe" ? "border-nutrition bg-nutrition-soft text-nutrition" : "border-border text-ink-soft"
              }`}
            >
              ✍️ {t.nutrition.addMeal.describeTab}
            </button>
          </div>

          {mode === "photo" ? (
            <>
              <p className="text-sm text-ink-soft">{t.nutrition.addMeal.photoHint}</p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-full rounded-xl bg-nutrition px-4 py-3 font-display text-sm font-medium text-white transition-colors hover:opacity-90"
              >
                {t.nutrition.addMeal.takeOrChoosePhoto}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
            </>
          ) : (
            <>
              <p className="text-sm text-ink-soft">{t.nutrition.addMeal.describeHint}</p>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.nutrition.addMeal.describePlaceholder}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-nutrition"
              />
              <button
                type="button"
                disabled={!description.trim()}
                onClick={handleDescribe}
                className="w-full rounded-xl bg-nutrition px-4 py-3 font-display text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {t.nutrition.addMeal.analyzeDescriptionCta}
              </button>
            </>
          )}
        </>
      )}

      {stage.name === "error" && (
        <>
          <p className="text-sm text-danger">{stage.message}</p>
          <button
            type="button"
            onClick={() => setStage({ name: "idle" })}
            className="rounded-xl border border-border px-4 py-2 font-display text-sm font-medium text-ink"
          >
            {t.nutrition.addMeal.tryAgain}
          </button>
        </>
      )}
    </div>
  );
}
