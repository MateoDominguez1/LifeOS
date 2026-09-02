import { analyzeFoodDescriptionWithGemini, analyzeFoodImageWithGemini } from "./providers/gemini";
import type { FoodAnalysisResult } from "./types";

export async function analyzeFoodImage(
  imageBase64: string,
  mimeType: string
): Promise<FoodAnalysisResult> {
  return analyzeFoodImageWithGemini(imageBase64, mimeType);
}

export async function analyzeFoodDescription(description: string): Promise<FoodAnalysisResult> {
  return analyzeFoodDescriptionWithGemini(description);
}

export type { FoodAnalysisResult, DetectedFood } from "./types";
