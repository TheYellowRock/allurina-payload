import type { CartLineItem } from "@/lib/cart/types"
import { cartItemCount, cartSubtotal } from "@/lib/cart/merge-lines"

/** Standard delivery fee (Dh) — waived from 5 items. */
export const DELIVERY_FEE_DH = 50

/** Per-item rebate (Dh) when cart has at least `VOLUME_MIN_ITEMS` pieces. */
export const VOLUME_UNIT_OFF_DH = 5

export const VOLUME_MIN_ITEMS = 3

export const FREE_DELIVERY_MIN_ITEMS = 5

export type CartPricingBreakdown = {
  itemCount: number
  merchandiseListTotal: number
  volumeDiscountDh: number
  merchandiseAfterVolume: number
  deliveryDh: number
  /** Saving vs standard delivery when shipping is free. */
  deliverySavingDh: number
  grandTotal: number
}

export function computeCartPricing(items: CartLineItem[]): CartPricingBreakdown {
  const itemCount = cartItemCount(items)
  const merchandiseListTotal = cartSubtotal(items)
  const volumeDiscountDh =
    itemCount >= VOLUME_MIN_ITEMS ? VOLUME_UNIT_OFF_DH * itemCount : 0
  const merchandiseAfterVolume = merchandiseListTotal - volumeDiscountDh
  const deliveryDh =
    itemCount === 0
      ? 0
      : itemCount >= FREE_DELIVERY_MIN_ITEMS
        ? 0
        : DELIVERY_FEE_DH
  const deliverySavingDh =
    itemCount >= FREE_DELIVERY_MIN_ITEMS ? DELIVERY_FEE_DH : 0
  const grandTotal = merchandiseAfterVolume + deliveryDh

  return {
    itemCount,
    merchandiseListTotal,
    volumeDiscountDh,
    merchandiseAfterVolume,
    deliveryDh,
    deliverySavingDh,
    grandTotal,
  }
}
