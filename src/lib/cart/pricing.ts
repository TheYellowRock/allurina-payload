import type { CartLineItem } from "@/lib/cart/types"
import { cartCheapestUnitPrice, cartItemCount, cartSubtotal } from "@/lib/cart/merge-lines"
import { ACTIVE_PROMO } from "@/lib/cart/promo-config"

/** Standard delivery fee (Dh) — waived at volume regardless of which promo is active. */
export const DELIVERY_FEE_DH = 35

export const FREE_DELIVERY_MIN_ITEMS = 5

/** "4+1" promo: from this many pièces in cart, the cheapest unit is offered (one-time, not per-tier). */
export const PROMO_FREE_ITEM_MIN_ITEMS = 5

export type CartPricingBreakdown = {
  itemCount: number
  /** Sum of cart lines (Payload unit price × qty). */
  merchandiseSaleTotal: number
  /** "4+1" promo discount — 0 unless `ACTIVE_PROMO === "four_plus_one"` and cart qualifies. */
  promoDiscountDh: number
  deliveryDh: number
  /** Free-delivery saving — applies at volume under either promo. */
  deliverySavingDh: number
  grandTotal: number
}

/**
 * Cart totals under whichever promo is active (`promo-config.ts`). Free delivery at volume
 * applies under both schemes; `four_plus_one` additionally waives the cheapest unit's price
 * once the cart reaches `PROMO_FREE_ITEM_MIN_ITEMS` — the two benefits stack.
 */
export function computeCartPricing(items: CartLineItem[]): CartPricingBreakdown {
  const itemCount = cartItemCount(items)
  const merchandiseSaleTotal = cartSubtotal(items)

  const freeDeliveryActive = itemCount >= FREE_DELIVERY_MIN_ITEMS
  const promoDiscountDh =
    ACTIVE_PROMO === "four_plus_one" && itemCount >= PROMO_FREE_ITEM_MIN_ITEMS
      ? cartCheapestUnitPrice(items)
      : 0

  const deliveryDh = itemCount === 0 ? 0 : freeDeliveryActive ? 0 : DELIVERY_FEE_DH
  const deliverySavingDh = freeDeliveryActive ? DELIVERY_FEE_DH : 0
  const grandTotal = merchandiseSaleTotal - promoDiscountDh + deliveryDh

  return {
    itemCount,
    merchandiseSaleTotal,
    promoDiscountDh,
    deliveryDh,
    deliverySavingDh,
    grandTotal,
  }
}
