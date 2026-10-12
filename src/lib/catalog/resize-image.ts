/**
 * Browser-side photo preparation for the quick product editor: phone photos are often
 * 3–8 MB, above Vercel's ~4.5 MB request limit and far heavier than the storefront needs.
 * Resizes to at most 1600 px on the long side and re-encodes as WebP (JPEG where the
 * browser can't encode WebP), typically 150–400 KB. EXIF rotation is applied.
 */

const MAX_SIDE = 1600

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" })
    } catch {
      // Fall through to <img> decoding (older Safari).
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = "async"
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

export async function prepareProductPhoto(file: File): Promise<File> {
  const source = await decode(file)
  const width = "naturalWidth" in source ? source.naturalWidth : source.width
  const height = "naturalHeight" in source ? source.naturalHeight : source.height
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height))
  const w = Math.max(1, Math.round(width * scale))
  const h = Math.max(1, Math.round(height * scale))

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("canvas")
  ctx.drawImage(source, 0, 0, w, h)
  if ("close" in source) source.close()

  // Safari can silently fall back to PNG when asked for WebP — check the actual type.
  let blob = await toBlob(canvas, "image/webp", 0.82)
  let ext = "webp"
  if (!blob || blob.type !== "image/webp") {
    blob = await toBlob(canvas, "image/jpeg", 0.85)
    ext = "jpg"
  }
  if (!blob) throw new Error("encode")

  const base = (file.name || "photo").replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").slice(0, 60) || "photo"
  return new File([blob], `${base}.${ext}`, { type: blob.type })
}
