import type { Where } from "payload"

/**
 * TEMPORARY (until the variant picker, cart and checkout support variants): products
 * with sizes/colours (`hasVariants`) are kept out of the storefront and refused at
 * checkout, so a pull can't be bought without choosing a size and colour, and its stock
 * can't be decremented at product level. You can create pulls and their variants in the
 * admin meanwhile — they simply don't show on the site yet.
 *
 * Written as equals-false-or-missing rather than `not_equals: true`, because in SQL
 * `has_variants <> true` would also drop rows where the column is NULL.
 */
export const SIMPLE_PRODUCTS_ONLY: Where = {
  or: [{ hasVariants: { equals: false } }, { hasVariants: { exists: false } }],
}

export function isVariableProduct(doc: object | null | undefined): boolean {
  return (doc as { hasVariants?: unknown } | null | undefined)?.hasVariants === true
}
