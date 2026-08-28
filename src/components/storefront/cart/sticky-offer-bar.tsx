"use client"

import { usePathname } from "next/navigation"
import { useMemo } from "react"

import { useCart } from "@/components/storefront/cart/cart-context"
import { gtmTrackViewCartFromBanner } from "@/lib/gtm"
import type { PromoCartMilestone } from "@/lib/promotions/types"
import { CHECKOUT_PATH } from "@/lib/routes"
import { cn } from "@/lib/utils"

/**
 * Built off the promo's own `cart.milestones` — never hardcodes a quantity or a promo
 * name — so it stays correct for whichever promo is active. Assumes the common
 * two-milestone shape (a free-shipping-style unlock, then a bigger unlock) that every
 * promo defined so far uses: below the first, between the two, at/past the last.
 * Promos with only one milestone still work (first === last).
 */
function offerMessage(itemCount: number, milestones: PromoCartMilestone[]): string {
  const sorted = [...milestones].sort((a, b) => a.qty - b.qty)
  const first = sorted[0]
  if (!first) return ""
  const last = sorted[sorted.length - 1]!

  const plural = (n: number) => (n > 1 ? "s" : "")

  if (itemCount === 0) {
    return `${first.label} dès ${first.qty} châle${plural(first.qty)}`
  }
  if (itemCount < first.qty) {
    const remaining = first.qty - itemCount
    return `Plus que ${remaining} châle${plural(remaining)} pour la ${first.label.toUpperCase()}`
  }
  if (itemCount < last.qty) {
    const remaining = last.qty - itemCount
    return `${first.label} ✓ — plus que ${remaining} pour ${last.label}`
  }
  if (last !== first) {
    return `${first.label} + ${last.label.replace(/^-/, "")} ✓`
  }
  return `${first.label} ✓`
}

export function StickyOfferBar() {
  const { itemCount, hydrated, open, promo, pricing, openCart } = useCart()
  const pathname = usePathname()

  const message = useMemo(
    () => offerMessage(itemCount, promo.cart.milestones),
    [itemCount, promo.cart.milestones],
  )

  const isCheckout = pathname?.startsWith(CHECKOUT_PATH) ?? false

  if (!hydrated || open || isCheckout || !message) return null

  return (
    <button
      type="button"
      onClick={() => {
        gtmTrackViewCartFromBanner({ itemCount, grandTotal: pricing.grandTotal })
        openCart()
      }}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex min-h-11 w-full items-center justify-center",
        "bg-[#e0102a] px-4 text-white",
        "pb-[env(safe-area-inset-bottom)]",
      )}
      aria-label={`${message} — ouvrir le panier`}
    >
      <span className="min-w-0 max-w-full truncate text-xs font-bold tracking-wide uppercase sm:text-sm">
        {message}
      </span>
    </button>
  )
}
