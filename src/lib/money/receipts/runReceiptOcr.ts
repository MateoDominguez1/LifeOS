/**
 * Corre OCR sobre la foto del comprobante enteramente en el navegador, con
 * el worker/core wasm y los datos de idioma alojados en /public/tesseract
 * (sin pedirlos a ningún CDN externo en tiempo de ejecución). Se importa
 * dinámicamente desde el componente para no meter tesseract.js en el bundle
 * principal — solo se descarga si el usuario realmente adjunta una foto.
 */
export async function runReceiptOcr(file: File): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    workerPath: "/tesseract/worker.min.js",
    corePath: "/tesseract",
    langPath: "/tesseract/lang-data",
  });

  try {
    const {
      data: { text },
    } = await worker.recognize(file);
    return text;
  } finally {
    await worker.terminate();
  }
}
