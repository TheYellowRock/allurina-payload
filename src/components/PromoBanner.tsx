"use client"

import { PROMO_TIERS } from "@/lib/promo-tiers"
import { cn } from "@/lib/utils"

/**
 * Bold, high-contrast, mobile-first promo banner — replaces `PromoSection` on the
 * homepage (see the parent page for the swap). Reads `PROMO_TIERS` directly; no data
 * fetching, no cart/checkout wiring — purely marketing display.
 */
export function PromoBanner({ className }: { className?: string }) {
  const bestTier = PROMO_TIERS[PROMO_TIERS.length - 1]

  return (
    <section
      className={cn("bg-[#e0102a] px-4 py-10 text-white sm:px-6 sm:py-14", className)}
      aria-label="Offre promotionnelle"
    >
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-balance text-2xl font-black leading-tight tracking-tight sm:text-3xl md:text-4xl">
          OFFRE CHOC — <span className="text-yellow-300">PLUS TU PRENDS, MOINS TU PAIES</span>
        </h2>

        {/* Mini cards, laid out horizontally: a scrollable strip on mobile, a 4-up row from sm+. */}
        <ul className="mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0">
          {PROMO_TIERS.map((tier) => {
            const isBest = bestTier ? tier.qty === bestTier.qty : false
            return (
              <li
                key={tier.qty}
                className={cn(
                  "flex min-w-[148px] shrink-0 snap-start flex-col items-center rounded-lg border-2 bg-white px-4 py-4 sm:min-w-0",
                  isBest ? "border-yellow-300 ring-4 ring-yellow-300/60" : "border-white/40",
                )}
              >
                {isBest ? (
                  <span className="mb-1.5 rounded-full bg-yellow-300 px-2 py-0.5 text-[9px] font-black tracking-widest text-[#e0102a]">
                    MEILLEURE OFFRE
                  </span>
                ) : null}

                {/* Quantity — big, in the accent red. */}
                <span className="text-5xl font-black leading-none text-[#e0102a] sm:text-6xl">
                  {tier.qty}
                </span>
                <span className="mt-1 text-[11px] font-bold tracking-widest text-stone-500 uppercase">
                  Châles
                </span>

                {/* Price — big, in a distinct color from the quantity. */}
                <span className="mt-3 text-3xl font-black leading-none text-stone-900 sm:text-4xl">
                  {tier.bundlePrice}
                  <span className="ml-1 text-base font-bold text-stone-500">DH</span>
                </span>

                {tier.freeShipping ? (
                  <span className="mt-2.5 text-[10px] font-bold tracking-wide text-emerald-600 uppercase">
                    Livraison offerte
                  </span>
                ) : null}
              </li>
            )
          })}
        </ul>

        <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-white/80 sm:text-sm">
          Offre limitée — stock disponible uniquement
        </p>
      </div>
    </section>
  )
}
