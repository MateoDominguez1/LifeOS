const TOTAL_KEYWORDS = [
  "total",
  "totale",
  "totale complessivo",
  "totale da pagare",
  "importo",
  "importo totale",
  "gran total",
  "monto total",
  "totale euro",
  "amount due",
];

const PRICE_PATTERN = /(\d{1,4}[.,]\d{2})\b/g;

function parsePrice(match: string): number {
  return Number(match.replace(",", "."));
}

/**
 * Mejor estimación del monto total a partir del texto crudo que devolvió el
 * OCR sobre la foto de un comprobante. Prioriza el número que aparece en la
 * misma línea que una palabra tipo "total"/"totale"/"importo" (ES/IT/EN); si
 * no encuentra ninguna, se queda con el precio más alto detectado en todo el
 * texto. Nunca es 100% confiable — el llamador debe tratarlo como una
 * sugerencia editable, no como un valor definitivo.
 */
export function extractAmountFromOcrText(text: string): number | null {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const allPrices: number[] = [];
  let keywordPrice: number | null = null;

  for (const line of lines) {
    const lower = line.toLowerCase();
    const matches = [...line.matchAll(PRICE_PATTERN)].map((match) => parsePrice(match[1]));
    const plausible = matches.filter((price) => price > 0 && price < 10000);
    allPrices.push(...plausible);

    if (keywordPrice === null && plausible.length > 0 && TOTAL_KEYWORDS.some((keyword) => lower.includes(keyword))) {
      keywordPrice = plausible[plausible.length - 1];
    }
  }

  if (keywordPrice !== null) return keywordPrice;
  if (allPrices.length === 0) return null;
  return Math.max(...allPrices);
}
