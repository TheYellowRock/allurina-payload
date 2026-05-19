import type { CartLineItem } from "@/lib/cart/types"
import { cartItemCount, cartSubtotal } from "@/lib/cart/merge-lines"

/** Standard delivery fee (Dh) — waived from `FREE_DELIVERY_MIN_ITEMS` pièces. */
export const DELIVERY_FEE_DH = 35

export const FREE_DELIVERY_MIN_ITEMS = 5

export type CartPricingBreakdown = {
  itemCount: number
  /** Sum of cart lines (Payload unit price × qty). */
  merchandiseSaleTotal: number
  deliveryDh: number
  /** When shipping is free (5+ pieces): equals `DELIVERY_FEE_DH` — shown as delivery saving in the cart. */
  deliverySavingDh: number
  grandTotal: number
}

/** Cart totals: line subtotals + delivery (35 Dh unless 5+ pièces → livraison offerte). No volume rebate. */
export function computeCartPricing(items: CartLineItem[]): CartPricingBreakdown {
  const itemCount = cartItemCount(items)
  const merchandiseSaleTotal = cartSubtotal(items)
  const deliveryDh =
    itemCount === 0
      ? 0
      : itemCount >= FREE_DELIVERY_MIN_ITEMS
        ? 0
        : DELIVERY_FEE_DH
  const deliverySavingDh =
    itemCount >= FREE_DELIVERY_MIN_ITEMS ? DELIVERY_FEE_DH : 0
  const grandTotal = merchandiseSaleTotal + deliveryDh

  return {
    itemCount,
    merchandiseSaleTotal,
    deliveryDh,
    deliverySavingDh,
    grandTotal,
  }
}
