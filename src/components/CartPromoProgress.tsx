"use client"

import { Check } from "lucide-react"
import { useMemo } from "react"

import { useCart } from "@/components/storefront/cart/cart-context"
import { formatScarfPrice } from "@/lib/storefront-scarf-display"
import { cn } from "@/lib/utils"

/**
 * AliExpress-style tier progress bar — presentational only, reads cart state, never
 * mutates it. Renders generically from `useCart().promo.cart` (milestones + statusFor)
 * — the SAME resolved definition the top bar/banner use, so this can never show a
 * different promo than what the customer was told applies. Derived values are memoized
 * off primitives (`itemCount`, `promoSavingsDh`) rather than off freshly-created
 * objects/arrays each render: a previous bug wiped a cart banner because a `useMemo`
 * depended on a value that changed identity on every render (see `cart-context.tsx`).
 */
export function CartPromoProgress({ className }: { className?: string }) {
  const { itemCount, pricing, promo } = useCart()
  const { milestones, statusFor } = promo.cart
  const { footnote, subline } = promo.banner

  const topMilestoneQty = useMemo(
    () => milestones.reduce((max, m) => Math.max(max, m.qty), 1),
    [milestones],
  )

  const status = useMemo(() => statusFor(itemCount), [statusFor, itemCount])
  const fillPercent = useMemo(
    () => Math.min(100, (itemCount / topMilestoneQty) * 100),
    [itemCount, topMilestoneQty],
  )

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="relative h-2 w-full rounded-full bg-stone-200">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[#c00000] transition-[width] duration-500 ease-out"
          style={{ width: `${fillPercent}%` }}
        />
        {milestones.map((milestone) => {
          const reached = itemCount >= milestone.qty
          const leftPercent = (milestone.qty / topMilestoneQty) * 100
          return (
            <div
              key={milestone.qty}
              className={cn(
                "absolute top-1/2 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors duration-300",
                reached
                  ? "border-[#c00000] bg-[#c00000] text-white"
                  : "border-stone-300 bg-white text-stone-400",
              )}
              style={{ left: `${leftPercent}%` }}
              aria-label={`${milestone.qty} pièces — ${milestone.label}${reached ? " (atteint)" : ""}`}
            >
              {reached ? <Check className="size-3" strokeWidth={3} /> : milestone.qty}
            </div>
          )
        })}
      </div>

      <p className="text-center text-[11px] font-medium leading-snug text-stone-700 sm:text-xs">
        {status.message}
      </p>

      {pricing.promoSavingsDh > 0 ? (
        <p className="text-center text-[11px] font-semibold text-[#c00000] sm:text-xs">
          Tu économises {formatScarfPrice(pricing.promoSavingsDh)}
        </p>
      ) : null}

      {footnote || subline ? (
        <div className="space-y-0.5 pt-1 text-center text-xs font-semibold leading-snug text-[#e0102a] sm:text-sm">
          {footnote ? <p>{footnote}</p> : null}
          {subline ? <p>{subline}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
