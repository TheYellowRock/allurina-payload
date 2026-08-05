import { DeliveryPromoSection } from "@/components/storefront/delivery-promo-section"
import { FourPlusOnePromoSection } from "@/components/storefront/four-plus-one-promo-section"
import { ACTIVE_PROMO } from "@/lib/cart/promo-config"

/** Renders the post-hero promo band for whichever promo is active — see `promo-config.ts`. */
export function PromoSection({ className }: { className?: string }) {
  return ACTIVE_PROMO === "four_plus_one" ? (
    <FourPlusOnePromoSection className={className} />
  ) : (
    <DeliveryPromoSection className={className} />
  )
}
