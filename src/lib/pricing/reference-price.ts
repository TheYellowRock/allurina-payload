export const PROMO_LABEL = "PROMO"

/**
 * Returns the reference (struck-through) price to show alongside `price`, or `null` when
 * there is nothing to cross out. The reference price lives on each product — the
 * `referencePrice` field in Payload (column `scarves.reference_price`) — and only shows
 * when it is strictly above the real price, so a product whose sale ends (price raised to
 * the reference) silently stops displaying as discounted. Every display surface must call
 * this rather than comparing inline, so the rule stays in this one place.
 */
export function getReferencePrice(price: number, referencePrice: number | null | undefined): number | null {
  if (!Number.isFinite(price) || price <= 0) return null
  if (typeof referencePrice !== "number" || !Number.isFinite(referencePrice)) return null
  return referencePrice > price ? referencePrice : null
}
