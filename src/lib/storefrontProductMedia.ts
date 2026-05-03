import { storefrontMediaUrl } from "@/lib/storefront-scarf-display"

function mediaAlt(image: unknown, fallback: string): string {
  if (image && typeof image === "object") {
    const alt = (image as { alt?: string }).alt
    if (typeof alt === "string" && alt.length) return alt
  }
  return fallback
}

/** Featured image first, then gallery; dedupes by URL. */
export function storefrontProductImages(
  featuredImage: unknown,
  galleryImages: unknown,
  titleFallback: string,
): { src: string; alt: string }[] {
  const out: { src: string; alt: string }[] = []
  const push = (image: unknown) => {
    const src = storefrontMediaUrl(image)
    if (!src) return
    out.push({ src, alt: mediaAlt(image, titleFallback) })
  }

  push(featuredImage)
  if (galleryImages && Array.isArray(galleryImages)) {
    for (const item of galleryImages) {
      push(item)
    }
  }

  const seen = new Set<string>()
  return out.filter((item) => {
    if (seen.has(item.src)) return false
    seen.add(item.src)
    return true
  })
}
