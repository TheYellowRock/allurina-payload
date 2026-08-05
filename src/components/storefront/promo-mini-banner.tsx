import type { ReactNode } from "react"

import { FreeDeliveryMiniBanner } from "@/components/storefront/free-delivery-mini-banner"
import { FreeItemMiniBanner } from "@/components/storefront/free-item-mini-banner"
import { ACTIVE_PROMO } from "@/lib/cart/promo-config"

/** Renders the compact promo band for whichever promo is active — see `promo-config.ts`. */
export function PromoMiniBanner({
  className,
  children,
}: {
  className?: string
  children?: ReactNode
}) {
  return ACTIVE_PROMO === "four_plus_one" ? (
    <FreeItemMiniBanner className={className}>{children}</FreeItemMiniBanner>
  ) : (
    <FreeDeliveryMiniBanner className={className}>{children}</FreeDeliveryMiniBanner>
  )
}
