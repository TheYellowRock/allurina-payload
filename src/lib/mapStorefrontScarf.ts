import { resolveStorefrontAvailability } from "@/lib/availability"
import type { StorefrontScarf } from "@/lib/storefront-scarf-types"

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback
}

/** Map a Payload `scarves` document (depth ≥ 1 for relations) to `StorefrontScarf`. */
export function mapDocToStorefrontScarf(doc: Record<string, unknown>): StorefrontScarf {
  const stockQuantity = num(doc.stockQuantity, 0)
  const lowStockThreshold = num(doc.lowStockThreshold, 5)

  const availability = resolveStorefrontAvailability({
    stockQuantity,
    lowStockThreshold,
    availabilityTags: doc.availabilityTags,
  })

  return {
    id: doc.id as string | number,
    title: String(doc.title ?? ""),
    slug: String(doc.slug ?? ""),
    price: num(doc.price, 0),
    stockQuantity,
    lowStockThreshold,
    description: doc.description,
    featuredImage: doc.featuredImage,
    galleryImages: doc.galleryImages ?? [],
    categories: doc.categories,
    collections: doc.collections,
    tags: doc.tags,
    availabilityTags: doc.availabilityTags,
    availability,
  }
}
