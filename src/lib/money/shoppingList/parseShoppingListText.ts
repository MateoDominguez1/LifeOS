export type ParsedShoppingListItem = { description: string; price: number };

const LINE_PATTERN = /^(.+?)[\s\-–—]+€?\s*(\d+(?:[.,]\d{1,2})?)\s*€?$/;

/**
 * Parsea texto pegado línea por línea con el formato "Producto - 1.50".
 * Tolera coma o punto decimal y un símbolo de euro opcional antes o después
 * del número. Las líneas que no matchean ese patrón se descartan en
 * silencio (ej. líneas vacías o un encabezado que se coló).
 */
export function parseShoppingListText(text: string): ParsedShoppingListItem[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(LINE_PATTERN);
      if (!match) return null;

      const description = match[1].trim();
      const price = Number(match[2].replace(",", "."));
      if (!description || !Number.isFinite(price) || price <= 0) return null;

      return { description, price };
    })
    .filter((item): item is ParsedShoppingListItem => item !== null);
}
