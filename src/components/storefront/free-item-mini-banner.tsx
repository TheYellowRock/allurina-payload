import type { ReactNode } from "react"
import { Gift } from "lucide-react"

import { deliveryPromo } from "@/components/storefront/delivery-promo-styles"
import { PROMO_FREE_ITEM_MIN_ITEMS } from "@/lib/cart/pricing"
import { cn } from "@/lib/utils"

const DEFAULT_COPY =
  "Ajoutez 5 châles à votre panier : le moins cher d'entre eux vous est offert."

type FreeItemMiniBannerProps = {
  className?: string
  /** Override main body line (below "4 + 1 gratuit"). */
  children?: ReactNode
}

/** Compact band (200px) — "4+1" promo, matches delivery mini banner typography & colors. */
export function FreeItemMiniBanner({ className, children }: FreeItemMiniBannerProps) {
  return (
    <section
      className={cn(
        "flex h-[200px] max-h-[200px] min-h-[200px] shrink-0 flex-col items-center justify-center border-y border-stone-200 bg-[#faf9f7] px-6 text-center",
        className,
      )}
      aria-label="Promotion 4 plus 1 gratuit"
    >
      <div className={deliveryPromo.iconBox}>
        <Gift className="size-[1.15rem]" strokeWidth={1.5} aria-hidden />
      </div>
      <p className={cn(deliveryPromo.heading, "mt-3 max-w-2xl text-[11px] sm:text-xs")}>
        {`Dès ${PROMO_FREE_ITEM_MIN_ITEMS} pièces`}
      </p>
      <p
        className={cn(
          deliveryPromo.accent,
          "mt-1.5 text-base font-normal leading-tight tracking-tight sm:text-lg",
        )}
      >
        4 + 1 gratuit
      </p>
      <p
        className={cn(
          deliveryPromo.body,
          "mt-2 max-w-xl text-balance text-[11px] leading-snug sm:text-xs",
        )}
      >
        {children ?? DEFAULT_COPY}
      </p>
    </section>
  )
}
