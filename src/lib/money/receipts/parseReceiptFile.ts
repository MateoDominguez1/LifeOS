export const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export interface ParsedReceipt {
  data: Uint8Array<ArrayBuffer>;
  mimeType: string;
  fileName: string;
}

/**
 * Lee la foto de comprobante de un FormData (si el usuario adjuntó una) y la
 * valida. Se guarda como bytes en la propia base de datos: no depende de
 * ningún servicio externo de almacenamiento.
 */
export async function parseReceiptFile(
  formData: FormData,
  fieldName = "receipt"
): Promise<ParsedReceipt | null> {
  const file = formData.get(fieldName);
  if (!(file instanceof File) || file.size === 0) return null;

  if (file.size > MAX_RECEIPT_SIZE_BYTES) {
    throw new Error("La imagen es demasiado grande (máximo 5MB)");
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("Formato de imagen no soportado (usá JPG, PNG, WEBP o HEIC)");
  }

  const data = new Uint8Array(await file.arrayBuffer());
  return { data, mimeType: file.type, fileName: file.name || "comprobante" };
}
