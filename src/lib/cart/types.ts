/** Client cart line — persisted in localStorage (see `CART_STORAGE_KEY`). */
export type CartLineItem = {
  productId: string
  /** Set for products with sizes/colours (pulls…): the chosen `product-variants` row. */
  variantId?: string
  /** Human label of the variant, e.g. "M/L · Noir". */
  variantLabel?: string
  slug: string
  title: string
  price: number
  /**
   * The product's "prix barré" shown struck through next to `price` — absent/null for a
   * plain price; variant lines share the product's. Optional because carts persisted
   * before the field existed don't have it; `applyCartValidation` backfills it silently.
   */
  referencePrice?: number | null
  quantity: number
  imageSrc: string | null
}

export type CartAddPayload = Omit<CartLineItem, "quantity"> & {
  quantity: number
}

/**
 * Identity of a cart line: the product, plus the variant when there is one — so
 * "Pull Nora M/L Noir" and "Pull Nora L/XL Noir" are two separate lines.
 */
export function lineKey(line: { productId: string; variantId?: string | null }): string {
  return line.variantId ? `${line.productId}:${line.variantId}` : line.productId
}

/** "Pull Nora — M/L · Noir" for a variant line, the plain title otherwise. */
export function lineDisplayTitle(line: { title: string; variantLabel?: string | null }): string {
  return line.variantLabel ? `${line.title} — ${line.variantLabel}` : line.title
}
