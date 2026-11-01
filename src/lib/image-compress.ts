/** Tope por archivo del bucket (2 MB); se deja margen. */
const MAX_BYTES = 1_800_000;

const toBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo procesar la imagen."))), "image/webp", quality),
  );

/**
 * Convierte a WebP en el navegador, cuidando la calidad:
 * - hasta 2000 px por lado (nítida en pantallas retina; nunca agranda una foto pequeña),
 * - calidad alta (0.92) y suavizado de alta calidad al reducir,
 * - si el archivo pasa del límite del bucket, baja la calidad de a poco hasta que quepa.
 * La tienda sirve cada foto ya en el tamaño que necesita cada pantalla (ver next/image).
 */
export async function toWebp(file: File, maxSide = 2000): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("El archivo no es una imagen.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("No se pudo leer la imagen. Usa JPG, PNG o WebP.");
  }

  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let blob = await toBlob(canvas, 0.92);
  for (const q of [0.86, 0.8, 0.74]) {
    if (blob.size <= MAX_BYTES) break;
    blob = await toBlob(canvas, q);
  }
  if (blob.size > MAX_BYTES) throw new Error("La foto es demasiado pesada incluso comprimida. Prueba con otra.");
  return blob;
}
