export interface CompressedImage {
  base64: string;
  mimeType: string;
  dataUrl: string;
}

export async function compressImage(
  file: File,
  maxDimension = 1024,
  quality = 0.8
): Promise<CompressedImage> {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);

  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo procesar la imagen.");
  }
  ctx.drawImage(img, 0, 0, width, height);

  const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
  const base64 = compressedDataUrl.split(",")[1] ?? "";

  return { base64, mimeType: "image/jpeg", dataUrl: compressedDataUrl };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    img.src = src;
  });
}
