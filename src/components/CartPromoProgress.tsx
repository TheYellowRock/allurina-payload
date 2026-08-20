"use client"

import { Check } from "lucide-react"
import { useMemo } from "react"

import { useCart } from "@/components/storefront/cart/cart-context"
import { BULK_UNIT_PRICE, PROMO_TIERS, nextTier } from "@/lib/promo-tiers"
import { formatScarfPrice } from "@/lib/storefront-scarf-display"
import { cn } from "@/lib/utils"

const TOP_TIER_QTY = PROMO_TIERS[PROMO_TIERS.length - 1]?.qty ?? 5

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

/**
 * AliExpress-style tier progress bar — presentational only, reads cart state, never
 * mutates it. Derived values are memoized off primitives (`itemCount`, `promoSavingsDh`)
 * rather than off freshly-created objects/arrays each render: a previous bug wiped a cart
 * banner because a `useMemo` depended on a value that changed identity on every render
 * (see `cart-context.tsx`) — `PROMO_TIERS` itself is a stable module-level constant, so
 * reading it inside these memos doesn't reintroduce that problem.
 */
export function CartPromoProgress({ className }: { className?: string }) {
  const { itemCount, pricing } = useCart()

  const statusLine = useMemo(() => buildStatusLine(itemCount), [itemCount])
  const fillPercent = useMemo(
    () => Math.min(100, (itemCount / TOP_TIER_QTY) * 100),
    [itemCount],
  )

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="relative h-2 w-full rounded-full bg-stone-200">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[#c00000] transition-[width] duration-500 ease-out"
          style={{ width: `${fillPercent}%` }}
        />
        {PROMO_TIERS.map((tier) => {
          const reached = itemCount >= tier.qty
          const leftPercent = (tier.qty / TOP_TIER_QTY) * 100
          return (
            <div
              key={tier.qty}
              className={cn(
                "absolute top-1/2 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors duration-300",
                reached
                  ? "border-[#c00000] bg-[#c00000] text-white"
                  : "border-stone-300 bg-white text-stone-400",
              )}
              style={{ left: `${leftPercent}%` }}
              aria-label={`${tier.qty} châles — ${tier.bundlePrice} DH${reached ? " (atteint)" : ""}`}
            >
              {reached ? <Check className="size-3" strokeWidth={3} /> : tier.qty}
            </div>
          )
        })}
      </div>

      <p className="text-center text-[11px] font-medium leading-snug text-stone-700 sm:text-xs">
        {statusLine}
      </p>

      {pricing.promoSavingsDh > 0 ? (
        <p className="text-center text-[11px] font-semibold text-[#c00000] sm:text-xs">
          Tu économises {formatScarfPrice(pricing.promoSavingsDh)}
        </p>
      ) : null}
    </div>
  )
}
