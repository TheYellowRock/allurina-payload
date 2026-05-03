import type { StorefrontAvailability } from "./availability"

/** Storefront shape for scarves — safe to import from Client Components (no Payload). */
export type StorefrontScarf = {
  id: number | string
  title: string
  slug: string
  price: number
  stockQuantity: number
  lowStockThreshold: number
  /** Lexical JSON — use on product page only when needed */
  description?: unknown
  featuredImage: unknown
  galleryImages: unknown
  categories: unknown
  collections: unknown
  tags: unknown
  availabilityTags: unknown
  availability: StorefrontAvailability
}
