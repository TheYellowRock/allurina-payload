"use client"

import { ShoppingBag } from "lucide-react"

import { useCart } from "@/components/storefront/cart/cart-context"
import { Button } from "@/components/ui/button"
import { gtmTrackViewCartFromBanner } from "@/lib/gtm"
import { formatScarfPrice } from "@/lib/storefront-scarf-display"
import { cn } from "@/lib/utils"

export function StickyCartBanner() {
  const { itemCount, pricing, hydrated, openCart } = useCart()

  if (!hydrated || itemCount === 0) return null

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "border-t border-stone-200/90 bg-[#faf9f7]/95 backdrop-blur-md",
        "shadow-[0_-8px_30px_rgba(15,15,15,0.08)]",
        "pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3",
      )}
      role="region"
      aria-label="Résumé du panier"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <ShoppingBag className="size-5 shrink-0 text-stone-700" strokeWidth={1.5} />
          <div className="min-w-0 leading-tight">
            <p className="text-xs font-light uppercase tracking-wide text-stone-500">
              {itemCount} article{itemCount !== 1 ? "s" : ""}
            </p>
            <p className="mt-0.5 tabular-nums text-sm font-semibold text-stone-900">
              {formatScarfPrice(pricing.grandTotal)}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-none border-2 border-stone-900 bg-stone-900 px-4 text-xs font-medium uppercase tracking-[0.15em] text-white hover:bg-stone-800"
          onClick={() => {
            gtmTrackViewCartFromBanner({
              itemCount,
              grandTotal: pricing.grandTotal,
            })
            openCart()
          }}
        >
          Voir Panier
        </Button>
      </div>
    </div>
  )
}
