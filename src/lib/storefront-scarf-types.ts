import type { StorefrontAvailability } from "./availability"

/** Storefront shape for scarves — safe to import from Client Components (no Payload). */
export type StorefrontScarf = {
  id: number | string
  title: string
  slug: string
  price: number
  stockQuantity: number
  /** Lexical JSON — use on product page only when needed */
  description?: unknown
  featuredImage: unknown
  galleryImages: unknown
  categories: unknown
  collections: unknown
  tags: unknown
  availabilityTags: unknown
  availability: StorefrontAvailability
  /** True for products sold in sizes/colours (pulls…): must be bought from the product page. */
  hasVariants?: boolean
  /** Product page only, for products with variants. */
  variantOptions?: StorefrontVariantOptions
  /**
   * Card-only overrides, used for "one card per colour" (a pull in Noir, the same pull in
   * Beige…): where the card links to, and the line shown under the title.
   */
  cardHref?: string
  cardSubtitle?: string
}

export type StorefrontVariant = {
  id: string
  sizeId: string
  colorId: string
  stock: number
  price: number
}

export type StorefrontVariantOptions = {
  /** Sizes used by this product, smallest first. */
  sizes: { id: string; label: string }[]
  colors: { id: string; slug: string; name: string; hex: string; images: { src: string; alt: string }[] }[]
  variants: StorefrontVariant[]
}
