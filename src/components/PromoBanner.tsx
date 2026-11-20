"use client"

import type { PromoBannerContent } from "@/lib/promotions/types"
import { cn } from "@/lib/utils"

/**
 * Numeral-led, mobile-first promo banner — replaces `PromoSection` on the homepage (see
 * the parent page for the swap). Renders generically from the active promo's `banner`
 * content (resolved server-side via `getActivePromo()`) — no promo copy is hardcoded
 * here, so switching the active promo changes this automatically. No headline, no red
 * slab — cards sit directly on the page background so the numeral (not a claim/slogan)
 * is the largest thing on screen above the grid. Chips wrap onto 2/row on mobile so
 * height stays bounded regardless of how many tiers a promo defines.
 */
export function PromoBanner({ banner, className }: { banner: PromoBannerContent; className?: string }) {
  return (
    <section className={cn("bg-[#faf9f7] px-4 py-6 sm:px-6 sm:py-8", className)} aria-label="Offre promotionnelle">
      <div className="mx-auto max-w-4xl">
        <ul className="flex flex-wrap justify-center gap-3 sm:gap-4">
          {banner.chips.map((chip) => {
            const red = chip.tone === "red"
            return (
            <li
              key={`${chip.value}-${chip.label}`}
              className={cn(
                "relative flex min-w-[104px] flex-1 flex-col items-center border px-3 py-4 text-center sm:px-4 sm:py-5",
                red ? "border-[#e0102a] bg-[#e0102a]" : "bg-white",
                chip.featured
                  ? "basis-full py-6 sm:basis-0 sm:grow-[1.4] sm:py-7"
                  : "basis-[calc(50%-0.375rem)] sm:basis-0",
                !red && (chip.highlight ? "border-2 border-[#e0102a]" : "border-stone-200"),
              )}
            >
              {chip.highlight ? (
                <span
                  className={cn(
                    "absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 text-[9px] font-black tracking-widest uppercase",
                    red ? "bg-white text-[#e0102a]" : "bg-[#e0102a] text-white",
                  )}
                >
                  {chip.badge ?? "Meilleure offre"}
                </span>
              ) : null}

              <span
                className={cn(
                  "font-black leading-none",
                  red ? "text-white" : "text-[#e0102a]",
                  chip.featured ? "text-7xl sm:text-7xl" : "text-5xl sm:text-6xl",
                )}
              >
                {chip.value}
              </span>
              {chip.unit ? (
                <span
                  className={cn(
                    "mt-1.5 text-[10px] font-bold tracking-widest uppercase",
                    red ? "text-white/85" : "text-stone-500",
                  )}
                >
                  {chip.unit}
                </span>
              ) : null}
              <span
                className={cn(
                  "mt-2 text-xs font-bold leading-tight sm:text-sm",
                  red ? "text-white" : "text-stone-800",
                )}
              >
                {chip.label}
              </span>
            </li>
            )
          })}
        </ul>

        {banner.footnote ? (
          <p className="mt-5 text-center text-sm font-bold tracking-wide text-[#e0102a] uppercase sm:text-base">
            {banner.footnote}
          </p>
        ) : null}

        {banner.subline ? (
          <p className="mt-2 text-center text-sm font-semibold text-[#e0102a] sm:text-base">{banner.subline}</p>
        ) : null}
      </div>
    </section>
  )
}
