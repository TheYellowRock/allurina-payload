"use client"

import type { ReactNode } from "react"

import { useCart } from "@/components/storefront/cart/cart-context"
import { cn } from "@/lib/utils"

/** Bottom padding on mobile when the sticky cart bar is visible so grids aren’t covered. */
export function MobileCartScrollPadding({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const { itemCount, hydrated } = useCart()
  const needsPad = hydrated && itemCount > 0

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        needsPad && "pb-24 md:pb-0",
        className,
      )}
    >
      {children}
    </div>
  )
}
