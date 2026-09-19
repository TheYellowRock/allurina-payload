import type { PromoCartStatus, PromoDefinition, PromoLineInput } from "../types"

/**
 * Pack promo — fixed all-inclusive prices by item count, delivery offered from the first
 * pack. The pack of 3 is the hero offer (top bar, featured banner chip, cart nudges).
 *
 *   1–2 items : catalog price + standard delivery
 *   3 items   : 220 DH, delivery offered
 *   4 items   : 275 DH, delivery offered
 *   5 items   : 350 DH, delivery offered
 *   6+ items  : 350 DH + 65 DH per item beyond 5, delivery offered
 *
 * Safety net: a pack never costs MORE than the catalog sum of its items (relevant once
 * cheaper lines such as the 65 DH "Unis" ship) — in that case the catalog sum is charged
 * and delivery stays offered.
 */

export type Pack = { qty: number; price: number }

export const PACKS: Pack[] = [
  { qty: 3, price: 220 },
  { qty: 4, price: 275 },
  { qty: 5, price: 350 },
]

/** Price of each item beyond the top pack (qty > 5). */
export const EXTRA_ITEM_PRICE = 65

const HERO_PACK = PACKS[0]!
const TOP_PACK = PACKS[PACKS.length - 1]!

function itemCountOf(items: PromoLineInput[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0)
}

function listTotalOf(items: PromoLineInput[]): number {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0)
}

/** Pack price for `qty` items, or `null` below the first pack. */
export function packPriceFor(qty: number): number | null {
  if (qty < HERO_PACK.qty) return null
  if (qty > TOP_PACK.qty) return TOP_PACK.price + (qty - TOP_PACK.qty) * EXTRA_ITEM_PRICE
  return PACKS.find((p) => p.qty === qty)?.price ?? null
}

function plural(n: number): string {
  return n > 1 ? "s" : ""
}

function buildStatusLine(qty: number): string {
  if (qty < HERO_PACK.qty) {
    const remaining = HERO_PACK.qty - qty
    return `Ajoute encore ${remaining} châle${plural(remaining)} : le pack de ${HERO_PACK.qty} à ${HERO_PACK.price} DH, LIVRAISON OFFERTE`
  }

  if (qty >= TOP_PACK.qty) {
    const price = packPriceFor(qty)
    return `${qty} châles pour ${price} DH ✓ Livraison offerte — chaque châle en plus : ${EXTRA_ITEM_PRICE} DH`
  }

  const next = PACKS.find((p) => p.qty > qty)
  const current = packPriceFor(qty)
  return next
    ? `${qty} châles pour ${current} DH ✓ Livraison offerte — Ajoute ${next.qty - qty} châle${plural(next.qty - qty)} : ${next.qty} pour ${next.price} DH`
    : `${qty} châles pour ${current} DH ✓ Livraison offerte`
}

function statusFor(itemCount: number): PromoCartStatus {
  return {
    message: buildStatusLine(itemCount),
    fillPercent: Math.min(100, (itemCount / TOP_PACK.qty) * 100),
  }
}

/** Sticky bottom bar copy — always steers toward the pack of 3 first. */
function offerBarFor(itemCount: number): string {
  if (itemCount === 0) {
    return `Pack ${HERO_PACK.qty} châles : ${HERO_PACK.price} DH · livraison offerte`
  }
  if (itemCount < HERO_PACK.qty) {
    const remaining = HERO_PACK.qty - itemCount
    return `Plus que ${remaining} châle${plural(remaining)} → ${HERO_PACK.qty} pour ${HERO_PACK.price} DH, livraison offerte`
  }
  if (itemCount < TOP_PACK.qty) {
    const next = PACKS.find((p) => p.qty > itemCount)!
    return `${itemCount} pour ${packPriceFor(itemCount)} DH ✓ — ${next.qty} pour ${next.price} DH`
  }
  return `${itemCount} pour ${packPriceFor(itemCount)} DH ✓ livraison offerte`
}

export const packs202609: PromoDefinition = {
  id: "packs-2026-09",
  label: "Packs 3 = 220 DH / 4 = 275 DH / 5 = 350 DH (+65 DH/art.)",
  topBar: `Pack ${HERO_PACK.qty} châles : ${HERO_PACK.price} DH · Livraison offerte`,
  banner: {
    subline: "Paiement à la livraison partout au Maroc",
    chips: PACKS.map((p) => ({
      value: p.price,
      unit: "DH",
      label: `${p.qty} châles · livraison offerte`,
      highlight: p.qty === HERO_PACK.qty,
      featured: p.qty === HERO_PACK.qty,
      badge: p.qty === HERO_PACK.qty ? "Offre du moment" : undefined,
    })),
    footnote: `Au-delà de ${TOP_PACK.qty} : +${EXTRA_ITEM_PRICE} DH par châle`,
  },
  cart: {
    milestones: PACKS.map((p) => ({ qty: p.qty, label: `${p.price} DH` })),
    statusFor,
    offerBarFor,
  },
  resolve: (items) => {
    const qty = itemCountOf(items)
    const listTotal = Math.round(listTotalOf(items) * 100) / 100
    const packPrice = packPriceFor(qty)

    if (packPrice === null) {
      return { total: listTotal, freeShipping: false, savings: 0, appliedLabel: null }
    }

    const total = Math.min(packPrice, listTotal)
    const savings = Math.max(0, Math.round((listTotal - total) * 100) / 100)
    return { total, freeShipping: true, savings, appliedLabel: `Pack ${qty} châles` }
  },
}
