"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import { useCart } from "@/components/storefront/cart/cart-context"
import { CHECKOUT_PATH } from "@/lib/routes"
import { cn } from "@/lib/utils"

/**
 * Bottom padding whenever `StickyOfferBar` is visible so it never covers the footer or
 * the grid's last row. That bar renders on every breakpoint (not just mobile) and even
 * at an empty cart, so this mirrors its own visibility rule exactly rather than gating
 * on `itemCount`.
 */
export function CartOfferBarScrollPadding({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const { hydrated } = useCart()
  const pathname = usePathname()
  const isCheckout = pathname?.startsWith(CHECKOUT_PATH) ?? false
  const needsPad = hydrated && !isCheckout

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        needsPad && "pb-[calc(2.75rem+env(safe-area-inset-bottom)+0.5rem)]",
        className,
      )}
    >
      {children}
    </div>
  )
}
