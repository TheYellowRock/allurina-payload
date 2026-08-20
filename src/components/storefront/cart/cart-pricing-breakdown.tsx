import type { CartPricingBreakdown } from "@/lib/cart/pricing"
import { formatScarfPrice } from "@/lib/storefront-scarf-display"

export function CartPricingBreakdownView({
  pricing,
  className = "",
}: {
  pricing: CartPricingBreakdown
  className?: string
}) {
  const {
    itemCount,
    merchandiseListTotal,
    merchandiseSaleTotal,
    promoSavingsDh,
    deliveryDh,
    deliverySavingDh,
    grandTotal,
  } = pricing

  const livraisonLabel =
    deliverySavingDh > 0 ? "GRATUITE" : itemCount > 0 ? formatScarfPrice(deliveryDh) : "—"

  return (
    <div className={`space-y-2 text-sm font-light ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-stone-700">
        <span>Sous-total articles</span>
        <span className="text-right font-medium tabular-nums text-stone-900">
          {promoSavingsDh > 0 ? (
            <span className="mr-2 text-stone-400 line-through">
              {formatScarfPrice(merchandiseListTotal)}
            </span>
          ) : null}
          {formatScarfPrice(merchandiseSaleTotal)}
        </span>
      </div>

      {promoSavingsDh > 0 ? (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[#c00000]">
          <span>Réduction lot</span>
          <span className="text-right font-medium tabular-nums">
            −{formatScarfPrice(promoSavingsDh)}
          </span>
        </div>
      ) : null}

      <div className="flex items-baseline justify-between gap-4 text-stone-700">
        <span>Livraison</span>
        <span className="text-right font-medium tabular-nums text-stone-900">{livraisonLabel}</span>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-stone-200 pt-3 text-stone-900">
        <span className="text-xs font-normal uppercase tracking-[0.2em] text-stone-500">
          Total
        </span>
        <span className="text-lg font-medium tabular-nums text-stone-900">
          {formatScarfPrice(grandTotal)}
        </span>
      </div>
    </div>
  )
}
