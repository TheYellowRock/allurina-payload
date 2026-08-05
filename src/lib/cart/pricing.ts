import type { CartLineItem } from "@/lib/cart/types"
import { cartCheapestUnitPrice, cartItemCount, cartSubtotal } from "@/lib/cart/merge-lines"
import { ACTIVE_PROMO } from "@/lib/cart/promo-config"

/** Standard delivery fee (Dh). Waived at volume only while the `free_delivery` promo is active. */
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
  /** Free-delivery promo saving — 0 unless `ACTIVE_PROMO === "free_delivery"` and cart qualifies. */
  deliverySavingDh: number
  grandTotal: number
}

/**
 * Cart totals under whichever promo is active (`promo-config.ts`). The two schemes never
 * apply together: `free_delivery` waives shipping at volume; `four_plus_one` waives the
 * cheapest unit's price at volume instead and shipping stays standard.
 */
export function computeCartPricing(items: CartLineItem[]): CartPricingBreakdown {
  const itemCount = cartItemCount(items)
  const merchandiseSaleTotal = cartSubtotal(items)

  const freeDeliveryActive =
    ACTIVE_PROMO === "free_delivery" && itemCount >= FREE_DELIVERY_MIN_ITEMS
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
