import { z } from "zod";
import type { FoodAnalysisResult } from "../types";

// "gemini-flash-latest" (the original app's model id) started returning
// persistent 503 "high demand" errors — confirmed via direct API probing
// that the alias itself is unhealthy while pinned versions work fine, so
// this is pinned to a real current model rather than a "latest" alias.
const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const detectedFoodSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  estimatedGrams: z.number().positive(),
  confidence: z.number().min(0).max(100),
  preparationMethod: z.string().optional(),
});

const analysisSchema = z.object({
  mealName: z.string().min(1),
  confidence: z.number().min(0).max(100),
  foods: z.array(detectedFoodSchema),
});

const RESPONSE_FORMAT_BLOCK = `Respondé ÚNICAMENTE con un JSON con esta forma exacta, sin texto adicional:

{
  "mealName": "nombre del plato en español, ej: 'Pasta con pollo'",
  "confidence": 82,
  "foods": [
    {
      "name": "nombre en inglés, simple y genérico, apto para buscar en una base de datos nutricional (ej: 'chicken breast', 'white rice', 'olive oil')",
      "displayName": "nombre en español para mostrar al usuario (ej: 'Pechuga de pollo')",
      "estimatedGrams": 150,
      "confidence": 90,
      "preparationMethod": "método de cocción si es identificable, en español (opcional)"
    }
  ]
}

"confidence" es un número de 0 a 100 en cada nivel (general y por alimento).
Si no estás seguro de un alimento, igual incluilo pero con confidence baja.`;

const IMAGE_PROMPT = `Sos un nutricionista analizando una foto de un plato de comida.

Identificá cada alimento, ingrediente, salsa, aceite visible o bebida en la
imagen y estimá su cantidad en gramos (o mililitros para líquidos, tratados
como gramos). Sé realista con las porciones: usá referencias visuales
(tamaño del plato, cubiertos, mano) para estimar.

${RESPONSE_FORMAT_BLOCK}

Si la imagen no muestra comida reconocible, respondé igual con el JSON,
usando "foods": [] y "confidence": 0.`;

const TEXT_PROMPT_PREFIX = `Sos un nutricionista analizando una descripción en texto, escrita por el
usuario, de lo que comió (puede estar en español, inglés o italiano).

Identificá cada alimento, ingrediente, salsa o bebida mencionado y estimá su
cantidad en gramos (o mililitros para líquidos, tratados como gramos) a
partir de cómo lo describió — si no da cantidades, usá una porción habitual
realista. Si menciona una marca o preparación conocida (ej. "Nutella", "pan
tostado"), identificá los alimentos reales que la componen.

${RESPONSE_FORMAT_BLOCK}

Si el texto no describe comida reconocible, respondé igual con el JSON,
usando "foods": [] y "confidence": 0.

Descripción del usuario: `;

async function callGemini(parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }>): Promise<FoodAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está configurada.");
  }

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseMimeType: "application/json" },
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini API respondió ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini no devolvió contenido analizable.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("La respuesta de Gemini no es JSON válido.");
  }

  const result = analysisSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`La respuesta de Gemini no tiene el formato esperado: ${result.error.message}`);
  }

  return result.data;
}

export async function analyzeFoodImageWithGemini(imageBase64: string, mimeType: string): Promise<FoodAnalysisResult> {
  return callGemini([{ text: IMAGE_PROMPT }, { inline_data: { mime_type: mimeType, data: imageBase64 } }]);
}

export async function analyzeFoodDescriptionWithGemini(description: string): Promise<FoodAnalysisResult> {
  return callGemini([{ text: `${TEXT_PROMPT_PREFIX}"${description}"` }]);
}
