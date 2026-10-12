import type { PromoCartStatus, PromoDefinition, PromoLineInput } from "../types"

/**
 * One cart rule: delivery is offered once the items total reaches 250 DH.
 * Item prices are always the catalog prices — no discount, no packs, no item-count rule.
 *
 *   items total < 250 DH  → catalog prices + standard delivery (35 DH)
 *   items total ≥ 250 DH  → catalog prices, delivery offered
 *
 * "Items total" = sum of line price × quantity, before delivery. Counts every product
 * type (scarves, pulls, …) the same way.
 */

export const FREE_DELIVERY_MIN_DH = 250

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function subtotalOf(items: PromoLineInput[]): number {
  return round2(items.reduce((sum, i) => sum + i.price * i.quantity, 0))
}

function remainingDh(subtotalDh: number): number {
  return Math.max(0, Math.ceil(FREE_DELIVERY_MIN_DH - subtotalDh))
}

function statusFor(_itemCount: number, subtotalDh: number): PromoCartStatus {
  const fillPercent = Math.min(100, (subtotalDh / FREE_DELIVERY_MIN_DH) * 100)
  if (subtotalDh <= 0) {
    return { message: `Livraison OFFERTE dès ${FREE_DELIVERY_MIN_DH} DH d’achat`, fillPercent: 0 }
  }
  if (subtotalDh < FREE_DELIVERY_MIN_DH) {
    return {
      message: `Plus que ${remainingDh(subtotalDh)} DH pour la LIVRAISON OFFERTE`,
      fillPercent,
    }
  }
  return { message: "Livraison OFFERTE ✓", fillPercent: 100 }
}

function offerBarFor(_itemCount: number, subtotalDh: number): string {
  if (subtotalDh <= 0) return `Livraison offerte dès ${FREE_DELIVERY_MIN_DH} DH`
  if (subtotalDh < FREE_DELIVERY_MIN_DH) {
    return `Plus que ${remainingDh(subtotalDh)} DH → livraison offerte`
  }
  return "Livraison offerte ✓"
}

export const freeDelivery250202610: PromoDefinition = {
  id: "free-delivery-250-2026-10",
  label: `Livraison offerte dès ${FREE_DELIVERY_MIN_DH} DH`,
  topBar: `Livraison offerte dès ${FREE_DELIVERY_MIN_DH} DH d’achat · Paiement à la livraison`,
  banner: {
    subline: "Paiement à la livraison partout au Maroc",
    chips: [
      {
        value: FREE_DELIVERY_MIN_DH,
        unit: "DH",
        label: "Livraison offerte dès ce montant",
        highlight: true,
        featured: true,
        badge: "Offre du moment",
      },
    ],
  },
  cart: {
    metric: "amount",
    milestones: [{ qty: FREE_DELIVERY_MIN_DH, label: "Livraison offerte" }],
    statusFor,
    offerBarFor,
  },
  resolve: (items) => {
    const subtotal = subtotalOf(items)
    const freeShipping = subtotal >= FREE_DELIVERY_MIN_DH
    return {
      total: subtotal,
      freeShipping,
      savings: 0,
      appliedLabel: freeShipping ? "Livraison offerte" : null,
    }
  },
}
