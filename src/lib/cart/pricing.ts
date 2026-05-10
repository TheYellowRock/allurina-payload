import type { CartLineItem } from "@/lib/cart/types"
import { cartItemCount, cartSubtotal } from "@/lib/cart/merge-lines"

/** Catalogue reference price per pièce (affiche barré vs prix soldé). */
export const CATALOG_LIST_PRICE_DH = 80

/** Standard delivery fee (Dh) — waived from `FREE_DELIVERY_MIN_ITEMS` pièces. */
export const DELIVERY_FEE_DH = 35

/** Per-item rebate (Dh) when cart has at least `VOLUME_MIN_ITEMS` pieces. */
export const VOLUME_UNIT_OFF_DH = 5

export const VOLUME_MIN_ITEMS = 3

export const FREE_DELIVERY_MIN_ITEMS = 5

export type CartPricingBreakdown = {
  itemCount: number
  /** Sous-total au tarif catalogue de référence (80 Dh × quantités). */
  merchandisePresaleTotal: number
  /** Sous-total aux prix soldés / panier (somme des lignes). */
  merchandiseSaleTotal: number
  volumeDiscountDh: number
  merchandiseAfterVolume: number
  deliveryDh: number
  /** Saving vs standard delivery when shipping is free. */
  deliverySavingDh: number
  /**
   * Total de référence barré : tarif catalogue (80 Dh × pièces) + livraison indicative 35 Dh.
   * Inclut toujours les 35 Dh lorsque le panier n’est pas vide, même si la livraison réelle est offerte (5+ pièces).
   */
  presaleGrandTotal: number
  grandTotal: number
}

export function computeCartPricing(items: CartLineItem[]): CartPricingBreakdown {
  const itemCount = cartItemCount(items)
  const merchandisePresaleTotal = items.reduce(
    (sum, line) => sum + CATALOG_LIST_PRICE_DH * line.quantity,
    0,
  )
  const merchandiseSaleTotal = cartSubtotal(items)
  const volumeDiscountDh =
    itemCount >= VOLUME_MIN_ITEMS ? VOLUME_UNIT_OFF_DH * itemCount : 0
  const merchandiseAfterVolume = merchandiseSaleTotal - volumeDiscountDh
  const deliveryDh =
    itemCount === 0
      ? 0
      : itemCount >= FREE_DELIVERY_MIN_ITEMS
        ? 0
        : DELIVERY_FEE_DH
  const deliverySavingDh =
    itemCount >= FREE_DELIVERY_MIN_ITEMS ? DELIVERY_FEE_DH : 0
  const presaleGrandTotal =
    itemCount === 0 ? 0 : merchandisePresaleTotal + DELIVERY_FEE_DH
  const grandTotal = merchandiseAfterVolume + deliveryDh

  return {
    itemCount,
    merchandisePresaleTotal,
    merchandiseSaleTotal,
    volumeDiscountDh,
    merchandiseAfterVolume,
    deliveryDh,
    deliverySavingDh,
    presaleGrandTotal,
    grandTotal,
  }
}
