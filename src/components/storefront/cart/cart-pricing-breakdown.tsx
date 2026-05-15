import {
  DELIVERY_FEE_DH,
  type CartPricingBreakdown,
  volumeRemiseDisplayedDh,
} from "@/lib/cart/pricing"
import { formatScarfPrice } from "@/lib/storefront-scarf-display"

const red = "text-red-600 tabular-nums"

export function CartPricingBreakdownView({
  pricing,
  className = "",
}: {
  pricing: CartPricingBreakdown
  className?: string
}) {
  const {
    itemCount,
    merchandisePresaleTotal,
    merchandiseSaleTotal,
    volumeDiscountDh,
    deliveryDh,
    deliverySavingDh,
    presaleGrandTotal,
    grandTotal,
  } = pricing

  const volumeRemiseLineDh = volumeRemiseDisplayedDh(pricing)

  return (
    <div className={`space-y-2 text-sm font-light ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-stone-700">
        <span>Sous-total articles</span>
        <span className="text-right tabular-nums">
          <span className="text-xs font-light text-red-500/90 line-through decoration-red-400">
            {formatScarfPrice(merchandisePresaleTotal)}
          </span>
          <span className={`ml-2 font-medium ${red}`}>
            {formatScarfPrice(merchandiseSaleTotal)}
          </span>
        </span>
      </div>

      {volumeDiscountDh > 0 ? (
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-stone-600">Remise volume</span>
          <span className={red}>{formatScarfPrice(-volumeRemiseLineDh)}</span>
        </div>
      ) : null}

      <div className="flex items-baseline justify-between gap-4 text-stone-700">
        <span>Livraison</span>
        <span className="text-right tabular-nums text-stone-900">
          {deliverySavingDh > 0 ? (
            <>
              <span className="text-stone-400 line-through decoration-stone-300">
                {formatScarfPrice(DELIVERY_FEE_DH)}
              </span>
              <span className="ml-2 text-stone-800">Offerte</span>
            </>
          ) : itemCount > 0 ? (
            formatScarfPrice(deliveryDh)
          ) : (
            "—"
          )}
        </span>
      </div>

      {deliverySavingDh > 0 ? (
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-stone-600">Remise livraison (5+ pièces)</span>
          <span className={red}>{formatScarfPrice(-deliverySavingDh)}</span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-stone-200 pt-3 text-stone-900">
        <span className="text-xs font-normal uppercase tracking-[0.2em] text-stone-500">
          Total
        </span>
        <span className="text-right">
          <span className="text-sm font-light text-red-500/90 line-through decoration-red-400 tabular-nums">
            {formatScarfPrice(presaleGrandTotal)}
          </span>
          <span className={`ml-2 text-lg font-light tabular-nums ${red}`}>
            {formatScarfPrice(grandTotal)}
          </span>
        </span>
      </div>
    </div>
  )
}
