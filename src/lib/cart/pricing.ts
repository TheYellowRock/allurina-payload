import type { CartLineItem } from "@/lib/cart/types"
import { cartItemCount, cartSubtotal } from "@/lib/cart/merge-lines"
import type { PromoDefinition } from "@/lib/promotions/types"

/** Standard delivery fee (Dh) — waived when the active promo grants free shipping. */
export const DELIVERY_FEE_DH = 35

/**
 * Legacy "4+1" constants — `computeCartPricing` no longer uses these (superseded by the
 * promotions registry), but the archived `FourPlusOnePromoSection` and
 * `FreeItemMiniBanner` components still import them for display purposes and were
 * intentionally left untouched in this pass.
 */
export const FREE_DELIVERY_MIN_ITEMS = 5
export const PROMO_FREE_ITEM_MIN_ITEMS = 5

export type CartPricingBreakdown = {
  itemCount: number
  /** Raw sum of line prices × qty, before promo pricing — shown crossed out when `promoSavingsDh > 0`. */
  merchandiseListTotal: number
  /** Promo-adjusted merchandise total — this is what's actually charged. */
  merchandiseSaleTotal: number
  /** `merchandiseListTotal - merchandiseSaleTotal`, i.e. what the promo's `resolve()` reports as `savings`. */
  promoSavingsDh: number
  deliveryDh: number
  /** Equals `DELIVERY_FEE_DH` when the active promo grants free shipping, else 0. */
  deliverySavingDh: number
  grandTotal: number
  /** What the active promo says was applied — e.g. "Palier 5 châles". Null when nothing applied. */
  appliedLabel: string | null
}

/**
 * Cart totals under whichever promo is active (`lib/promotions/active.ts` — see
 * `CartPromoProgress` for the progress bar). `promo` must be the SAME resolved
 * definition the caller's top bar/banner are using — callers get it from
 * `useCart().promo` (client) or `getActivePromo()` (server), never re-derive it here, so
 * pricing can never disagree with what the customer was shown.
 */
export function computeCartPricing(items: CartLineItem[], promo: PromoDefinition): CartPricingBreakdown {
  const itemCount = cartItemCount(items)
  const merchandiseListTotal = cartSubtotal(items)

  const {
    total: merchandiseSaleTotal,
    freeShipping,
    savings: promoSavingsDh,
    appliedLabel,
  } = promo.resolve(items)

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
    appliedLabel,
  }
}
