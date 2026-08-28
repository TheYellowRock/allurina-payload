import type { PromoCartStatus, PromoDefinition, PromoLineInput } from "../types"

/**
 * The tier-bundle promo — migrated unchanged from the old `lib/promo-tiers.ts` (now a
 * thin re-export shim over this file). Same numbers, same rounding, same free-shipping
 * rule; only the surrounding shape changed to fit the `PromoDefinition` contract.
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

const TOP_TIER_QTY = PROMO_TIERS[PROMO_TIERS.length - 1]?.qty ?? 5
const FIRST_TIER = PROMO_TIERS[0]

function itemCountOf(items: PromoLineInput[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0)
}

function listTotalOf(items: PromoLineInput[]): number {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0)
}

export type TierPriceResult = { total: number; freeShipping: boolean; savings: number }

/** Unchanged logic from the old `resolvePromoPrice(qty, unitPrice)`. */
export function resolveTierPrice(qty: number, unitPrice: number): TierPriceResult {
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

/** Migrated unchanged from `CartPromoProgress.tsx`'s local `buildStatusLine`. */
function buildStatusLine(qty: number): string {
  if (qty <= 1) {
    const target = PROMO_TIERS[0]
    if (!target) return ""
    const remaining = target.qty - qty
    return `Ajoute encore ${remaining} châle(s) pour la LIVRAISON GRATUITE + ${target.qty} pour ${target.bundlePrice} DH`
  }

  if (qty >= 6) {
    return `Prix de gros ✓ — ${BULK_UNIT_PRICE} DH par châle · LIVRAISON GRATUITE`
  }

  const currentTier = PROMO_TIERS.find((t) => t.qty === qty)
  const upcoming = nextTier(qty)

  if (qty === 2) {
    return upcoming
      ? `LIVRAISON GRATUITE débloquée ✓ — Ajoute ${upcoming.qty - qty} châle : ${upcoming.qty} pour ${upcoming.bundlePrice} DH`
      : "LIVRAISON GRATUITE débloquée ✓"
  }

  if (!upcoming) {
    // qty === 5 — top tier, nothing further to unlock.
    return `Meilleur prix débloqué ✓ — ${currentTier?.qty} pour ${currentTier?.bundlePrice} DH`
  }

  // qty === 3 or 4
  return `${currentTier?.qty} pour ${currentTier?.bundlePrice} DH débloqué ✓ — Ajoute ${upcoming.qty - qty} châle : ${upcoming.qty} pour ${upcoming.bundlePrice} DH`
}

function statusFor(itemCount: number): PromoCartStatus {
  return {
    message: buildStatusLine(itemCount),
    fillPercent: Math.min(100, (itemCount / TOP_TIER_QTY) * 100),
  }
}

function appliedLabelFor(qty: number): string {
  if (qty >= 6) return "Tarif gros volume"
  if (qty >= 2) return `Palier ${qty} châles`
  return "Prix catalogue"
}

export const tiers202608: PromoDefinition = {
  id: "tiers-2026-08",
  label: "Paliers quantité (2026-08)",
  topBar: FIRST_TIER
    ? `Dès ${FIRST_TIER.qty} châles : ${FIRST_TIER.bundlePrice} DH + livraison offerte`
    : "",
  banner: {
    subline: "Livraison offerte sur tous les paliers",
    chips: PROMO_TIERS.map((t) => ({
      value: t.bundlePrice,
      unit: "DH",
      label: `${t.qty} châles`,
      highlight: t.qty === TOP_TIER_QTY,
    })),
    footnote: "Offre limitée — stock disponible uniquement",
  },
  cart: {
    milestones: PROMO_TIERS.map((t) => ({ qty: t.qty, label: `${t.bundlePrice} DH` })),
    statusFor,
  },
  resolve: (items) => {
    const qty = itemCountOf(items)
    const listTotal = listTotalOf(items)
    const unitPrice = qty > 0 ? listTotal / qty : 0
    const { total, freeShipping, savings } = resolveTierPrice(qty, unitPrice)
    return { total, freeShipping, savings, appliedLabel: appliedLabelFor(qty) }
  },
}
