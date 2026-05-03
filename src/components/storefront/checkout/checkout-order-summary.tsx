import Link from "next/link"

import { CartPricingBreakdownView } from "@/components/storefront/cart/cart-pricing-breakdown"
import type { CartPricingBreakdown } from "@/lib/cart/pricing"
import type { CartLineItem } from "@/lib/cart/types"
import { formatScarfPrice } from "@/lib/storefront-scarf-display"
import { productPath } from "@/lib/routes"

const rowInput =
  "h-11 rounded-none border border-stone-300 bg-white px-3 text-sm font-light text-stone-900 outline-none placeholder:text-stone-400 focus-visible:border-stone-900 focus-visible:ring-1 focus-visible:ring-stone-900"

export function CheckoutOrderSummary({
  items,
  pricing,
}: {
  items: CartLineItem[]
  pricing: CartPricingBreakdown
}) {
  return (
    <aside className="border border-stone-200 bg-stone-50/60 p-5 md:p-6">
      <h2 className="text-xs font-light uppercase tracking-[0.22em] text-stone-500">
        Récapitulatif
      </h2>
      <ul className="mt-4 divide-y divide-stone-200/90">
        {items.map((line) => (
          <li key={line.productId} className="flex gap-3 py-3 first:pt-0">
            <div className="relative size-14 shrink-0 overflow-hidden bg-stone-200">
              {line.imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={line.imageSrc}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-[10px] text-stone-500">
                  —
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={productPath(line.slug)}
                className="line-clamp-2 text-sm font-light text-stone-900 hover:underline"
              >
                {line.title}
              </Link>
              <p className="mt-0.5 text-xs font-light tabular-nums text-stone-600">
                {formatScarfPrice(line.price)} × {line.quantity}
              </p>
            </div>
            <p className="shrink-0 text-sm font-light tabular-nums text-stone-900">
              {formatScarfPrice(line.price * line.quantity)}
            </p>
          </li>
        ))}
      </ul>
      <CartPricingBreakdownView pricing={pricing} className="mt-4 border-t border-stone-200 pt-4" />
      <p className="mt-3 text-[11px] font-light leading-relaxed text-stone-500">
        Paiement à la livraison : vous réglerez{" "}
        <span className="font-medium text-stone-700">{formatScarfPrice(pricing.grandTotal)}</span>{" "}
        au livreur en espèces (ou selon modalités communiquées par notre équipe).
      </p>
    </aside>
  )
}

export { rowInput }
