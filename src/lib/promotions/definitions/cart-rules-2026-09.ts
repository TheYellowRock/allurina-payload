import type { PromoCartStatus, PromoDefinition, PromoLineInput } from "../types"

/**
 * Cart-rule-only promo — no per-item pricing at all. Item prices always come straight
 * from the catalog; this definition only ever adds free shipping and/or a flat
 * percentage discount based on total item count. No price bands, no segment/category
 * inference, no per-unit ladders.
 */

const FREE_SHIPPING_MIN_ITEMS = 3
const EXTRA_DISCOUNT_MIN_ITEMS = 5
const EXTRA_DISCOUNT_RATE = 0.1

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function itemCountOf(items: PromoLineInput[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0)
}

function subtotalOf(items: PromoLineInput[]): number {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0)
}

function buildStatusLine(qty: number): string {
  if (qty < FREE_SHIPPING_MIN_ITEMS) {
    const remaining = FREE_SHIPPING_MIN_ITEMS - qty
    return `Ajoute encore ${remaining} châle(s) pour la LIVRAISON GRATUITE`
  }
  if (qty < EXTRA_DISCOUNT_MIN_ITEMS) {
    const remaining = EXTRA_DISCOUNT_MIN_ITEMS - qty
    return `Livraison GRATUITE ✓ — Ajoute ${remaining} châle(s) pour -10%`
  }
  return "Livraison GRATUITE + 10% de remise ✓"
}

function statusFor(itemCount: number): PromoCartStatus {
  return {
    message: buildStatusLine(itemCount),
    fillPercent: Math.min(100, (itemCount / EXTRA_DISCOUNT_MIN_ITEMS) * 100),
  }
}

export const cartRules202609: PromoDefinition = {
  id: "cart-rules-2026-09",
  label: "Livraison offerte 3+ / -10% 5+",
  topBar: "Livraison offerte dès 3 châles · -10% dès 5",
  banner: {
    subline: "Paiement à la livraison partout au Maroc",
    chips: [
      { value: FREE_SHIPPING_MIN_ITEMS, unit: "châles", label: "Livraison offerte" },
      { value: EXTRA_DISCOUNT_MIN_ITEMS, unit: "châles", label: "Livraison offerte + 10%", highlight: true },
    ],
  },
  cart: {
    milestones: [
      { qty: FREE_SHIPPING_MIN_ITEMS, label: "Livraison offerte" },
      { qty: EXTRA_DISCOUNT_MIN_ITEMS, label: "-10%" },
    ],
    statusFor,
  },
  resolve: (items) => {
    const qty = itemCountOf(items)
    const subtotal = subtotalOf(items)
    const freeShipping = qty >= FREE_SHIPPING_MIN_ITEMS
    const discountRate = qty >= EXTRA_DISCOUNT_MIN_ITEMS ? EXTRA_DISCOUNT_RATE : 0
    const total = round2(subtotal * (1 - discountRate))
    const savings = round2(subtotal - total)

    const appliedLabel =
      qty < FREE_SHIPPING_MIN_ITEMS
        ? null
        : qty < EXTRA_DISCOUNT_MIN_ITEMS
          ? "Livraison offerte"
          : "Livraison offerte + 10%"

    return { total, freeShipping, savings, appliedLabel }
  },
}
