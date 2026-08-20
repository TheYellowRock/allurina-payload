/**
 * Single source of truth for the bundle-pricing promotion shown in `PromoBanner`. Pure
 * data + pure functions only — no DB, no Payload, no env vars, no async. Not wired into
 * cart/checkout pricing; this is a marketing display utility only.
 */

export type PromoTier = { qty: number; bundlePrice: number; freeShipping: boolean }

export const PROMO_TIERS: PromoTier[] = [
  { qty: 2, bundlePrice: 160, freeShipping: true },
  { qty: 3, bundlePrice: 220, freeShipping: true },
  { qty: 4, bundlePrice: 270, freeShipping: true },
  { qty: 5, bundlePrice: 320, freeShipping: true },
]

/** Applies to qty >= 6 — no fixed bundle beyond the top tier, just a flat per-unit rate. */
export const BULK_UNIT_PRICE = 65

export type PromoPriceResult = {
  total: number
  freeShipping: boolean
  savings: number
}

export function resolvePromoPrice(qty: number, unitPrice: number): PromoPriceResult {
  if (qty <= 0) {
    return { total: 0, freeShipping: false, savings: 0 }
  }

  if (qty === 1) {
    return { total: Math.round(unitPrice), freeShipping: false, savings: 0 }
  }

  let total: number
  let freeShipping: boolean

  if (qty >= 6) {
    total = qty * BULK_UNIT_PRICE
    freeShipping = true
  } else {
    const tier = PROMO_TIERS.find((t) => t.qty === qty)
    if (tier) {
      total = tier.bundlePrice
      freeShipping = tier.freeShipping
    } else {
      // qty falls between defined tiers (not currently possible — 2..5 are all defined
      // — but keep this from ever returning an undefined total if tiers change later).
      total = qty * unitPrice
      freeShipping = false
    }
  }

  total = Math.round(total)
  const savings = Math.max(0, Math.round(qty * unitPrice - total))

  return { total, freeShipping, savings }
}

/** The next tier to reach, or `null` once `qty` is already at (or past) the top tier. */
export function nextTier(qty: number): PromoTier | null {
  if (qty >= 5) return null
  return PROMO_TIERS.find((t) => t.qty > qty) ?? null
}
