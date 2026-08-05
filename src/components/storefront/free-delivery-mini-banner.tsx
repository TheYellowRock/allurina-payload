import type { ReactNode } from "react"
import { Package } from "lucide-react"

import { deliveryPromo } from "@/components/storefront/delivery-promo-styles"
import { cn } from "@/lib/utils"

const DEFAULT_COPY =
  "Choisissez vos 5 châles préférés et profitez de la livraison gratuite partout au Maroc."

type FreeDeliveryMiniBannerProps = {
  className?: string
  /** Override main body line (below “+ Livraison gratuite”). */
  children?: ReactNode
}

/**
 * Compact band (200px) — archived promo variant: free delivery from 5 pièces. Not rendered
 * while `ACTIVE_PROMO` (`promo-config.ts`) is `"four_plus_one"`; kept for the planned toggle.
 * Active sibling: `FreeItemMiniBanner`.
 */
export function FreeDeliveryMiniBanner({
  className,
  children,
}: FreeDeliveryMiniBannerProps) {
  return (
    <section
      className={cn(
        "flex h-[200px] max-h-[200px] min-h-[200px] shrink-0 flex-col items-center justify-center border-y border-stone-200 bg-[#faf9f7] px-6 text-center",
        className,
      )}
      aria-label="Livraison gratuite"
    >
      <div className={cn(deliveryPromo.iconBox, "size-11")}>
        <Package className="size-[1.15rem]" strokeWidth={1.5} aria-hidden />
      </div>
      <p className={cn(deliveryPromo.heading, "mt-3 max-w-2xl text-[11px] sm:text-xs")}>
        Dès 5 pièces
      </p>
      <p
        className={cn(
          deliveryPromo.accent,
          "mt-1.5 text-base font-normal leading-tight tracking-tight sm:text-lg",
        )}
      >
        + Livraison gratuite
      </p>
      <p className={cn(deliveryPromo.body, "mt-2 max-w-xl text-balance text-[11px] leading-snug sm:text-xs")}>
        {children ?? DEFAULT_COPY}
      </p>
    </section>
  )
}
