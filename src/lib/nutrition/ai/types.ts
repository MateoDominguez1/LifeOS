export interface DetectedFood {
  /** English common name, suitable for matching against a nutrition database. */
  name: string;
  /** Name to show the user, in the app's language. */
  displayName: string;
  estimatedGrams: number;
  /** 0-100 */
  confidence: number;
  preparationMethod?: string;
}

export interface FoodAnalysisResult {
  mealName: string;
  /** 0-100, overall confidence in the analysis. */
  confidence: number;
  foods: DetectedFood[];
}

export interface FoodImageAnalyzer {
  analyzeFoodImage(imageBase64: string, mimeType: string): Promise<FoodAnalysisResult>;
}
