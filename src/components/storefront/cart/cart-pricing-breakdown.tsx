import {
  DELIVERY_FEE_DH,
  VOLUME_UNIT_OFF_DH,
  type CartPricingBreakdown,
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
    merchandiseListTotal,
    volumeDiscountDh,
    deliveryDh,
    deliverySavingDh,
    grandTotal,
  } = pricing

  return (
    <div className={`space-y-2 text-sm font-light ${className}`}>
      <div className="flex items-baseline justify-between gap-4 text-stone-700">
        <span>Sous-total articles</span>
        <span className="tabular-nums text-stone-900">
          {formatScarfPrice(merchandiseListTotal)}
        </span>
      </div>

      {volumeDiscountDh > 0 ? (
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-stone-600">
            Remise volume (3+ pièces, −{VOLUME_UNIT_OFF_DH} Dh / pièce)
          </span>
          <span className={red}>{formatScarfPrice(-volumeDiscountDh)}</span>
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

      <div className="flex items-baseline justify-between gap-4 border-t border-stone-200 pt-3 text-stone-900">
        <span className="text-xs font-normal uppercase tracking-[0.2em] text-stone-500">
          Total
        </span>
        <span className="text-lg font-light tabular-nums">{formatScarfPrice(grandTotal)}</span>
      </div>
    </div>
  )
}
