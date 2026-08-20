import type { CartLineItem } from "@/lib/cart/types"
import { cartItemCount, cartSubtotal } from "@/lib/cart/merge-lines"
import { resolvePromoPrice } from "@/lib/promo-tiers"

/** Standard delivery fee (Dh) — waived when the tier-bundle promo grants free shipping. */
export const DELIVERY_FEE_DH = 35

/**
 * Legacy "4+1" constants — `computeCartPricing` no longer uses these (superseded by
 * `resolvePromoPrice`/`PROMO_TIERS`), but the archived `FourPlusOnePromoSection` and
 * `FreeItemMiniBanner` components still import them for display purposes and were
 * intentionally left untouched in this pass.
 */
export const FREE_DELIVERY_MIN_ITEMS = 5
export const PROMO_FREE_ITEM_MIN_ITEMS = 5

export type CartPricingBreakdown = {
  itemCount: number
  /** Raw sum of line prices × qty, before tier-bundle pricing — shown crossed out when `promoSavingsDh > 0`. */
  merchandiseListTotal: number
  /** Tier-bundle-adjusted merchandise total — this is what's actually charged. */
  merchandiseSaleTotal: number
  /** `merchandiseListTotal - merchandiseSaleTotal`, i.e. what `resolvePromoPrice` reports as `savings`. */
  promoSavingsDh: number
  deliveryDh: number
  /** Equals `DELIVERY_FEE_DH` when the tier-bundle promo grants free shipping, else 0. */
  deliverySavingDh: number
  grandTotal: number
}

/**
 * Cart totals under the tier-bundle promo (`lib/promo-tiers.ts` — see `CartPromoProgress`
 * for the AliExpress-style progress bar). This supersedes the old "4+1" per-item discount:
 * `resolvePromoPrice` is now the single source of truth for both the merchandise total and
 * whether delivery is free. `unitPrice` is the cart's average per-unit price
 * (`merchandiseListTotal / itemCount`) — carts mixing different products at different
 * prices still get an exact `savings` figure this way, since `itemCount × avgUnitPrice`
 * always equals `merchandiseListTotal` by construction; the bundle `total` itself for
 * qty 2–5 comes straight from `PROMO_TIERS` regardless of `unitPrice`.
 */
export function computeCartPricing(items: CartLineItem[]): CartPricingBreakdown {
  const itemCount = cartItemCount(items)
  const merchandiseListTotal = cartSubtotal(items)
  const avgUnitPrice = itemCount > 0 ? merchandiseListTotal / itemCount : 0

  const {
    total: merchandiseSaleTotal,
    freeShipping,
    savings: promoSavingsDh,
  } = resolvePromoPrice(itemCount, avgUnitPrice)

  const deliveryDh = itemCount === 0 ? 0 : freeShipping ? 0 : DELIVERY_FEE_DH
  const deliverySavingDh = freeShipping ? DELIVERY_FEE_DH : 0
  const grandTotal = merchandiseSaleTotal + deliveryDh

  return {
    itemCount,
    merchandiseListTotal,
    merchandiseSaleTotal,
    promoSavingsDh,
    deliveryDh,
    deliverySavingDh,
    grandTotal,
  }
}
