import { DELIVERY_FEE_DH, type CartPricingBreakdown } from "@/lib/cart/pricing"
import { formatScarfPrice } from "@/lib/storefront-scarf-display"

/**
 * Receipt-style breakdown, shared by the cart drawer and the checkout summary:
 *
 *   Total articles      catalog sum of the lines
 *   Livraison           always the standard fee
 *   Total               articles + delivery, before any promo
 *   Réduction <promo>   in red — everything the active promo takes off (pack discount
 *                       AND the offered delivery), i.e. exactly what brings the total
 *                       down to the pack price
 *   À payer             what the customer hands the courier
 *
 * The delivery fee is deliberately shown in full and then cancelled inside the red
 * reduction line rather than displayed as "GRATUITE": the customer sees one big saving
 * that lands on the advertised pack price (220 / 275 / 350 DH). Purely presentational —
 * every number is derived from `CartPricingBreakdown`, whose server-side twin is what
 * checkout actually charges.
 */
export function CartPricingBreakdownView({
  pricing,
  className = "",
}: {
  pricing: CartPricingBreakdown
  className?: string
}) {
  const { itemCount, merchandiseListTotal, promoSavingsDh, deliverySavingDh, grandTotal, appliedLabel } =
    pricing

  const hasItems = itemCount > 0
  const standardDeliveryDh = hasItems ? DELIVERY_FEE_DH : 0
  const totalBeforeReduction = merchandiseListTotal + standardDeliveryDh
  const reductionDh = promoSavingsDh + deliverySavingDh
  const hasReduction = reductionDh > 0

  return (
    <div className={`space-y-2 text-sm font-light ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-stone-700">
        <span>Total articles</span>
        <span className="text-right font-medium tabular-nums text-stone-900">
          {formatScarfPrice(merchandiseListTotal)}
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-4 text-stone-700">
        <span>Livraison</span>
        <span className="text-right font-medium tabular-nums text-stone-900">
          {hasItems ? formatScarfPrice(standardDeliveryDh) : "—"}
        </span>
      </div>

      {hasReduction ? (
        <>
          <div className="flex items-baseline justify-between gap-4 border-t border-stone-200 pt-2 text-stone-700">
            <span>Total</span>
            <span className="text-right font-medium tabular-nums text-stone-500 line-through">
              {formatScarfPrice(totalBeforeReduction)}
            </span>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-medium text-[#c00000]">
            <span>
              Réduction{appliedLabel ? ` ${appliedLabel}` : ""}
              {deliverySavingDh > 0 ? (
                <span className="block text-[11px] font-normal">livraison offerte incluse</span>
              ) : null}
            </span>
            <span className="text-right text-base font-semibold tabular-nums">
              −{formatScarfPrice(reductionDh)}
            </span>
          </div>
        </>
      ) : null}

      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-stone-200 pt-3 text-stone-900">
        <span className="text-xs font-normal uppercase tracking-[0.2em] text-stone-500">
          {hasReduction ? "À payer" : "Total"}
        </span>
        <span className="text-lg font-medium tabular-nums text-stone-900">
          {formatScarfPrice(grandTotal)}
        </span>
      </div>
    </div>
  )
}
