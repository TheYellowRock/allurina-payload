export const REFERENCE_PRICE = 80
export const PROMO_LABEL = "PROMO"

/**
 * Returns the reference (struck-through) price to show alongside `price`, or `null` when
 * `price` isn't below `REFERENCE_PRICE` (or isn't a usable positive number). Every
 * display surface must call this rather than reimplementing the `price < REFERENCE_PRICE`
 * check inline, so the threshold and copy stay in this one place.
 */
export function getReferencePrice(price: number): number | null {
  if (!Number.isFinite(price) || price <= 0) return null
  return price < REFERENCE_PRICE ? REFERENCE_PRICE : null
}
