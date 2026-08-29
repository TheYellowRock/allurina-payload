import { getReferencePrice } from "@/lib/pricing/reference-price"
import { formatScarfPrice } from "@/lib/storefront-scarf-display"
import { cn } from "@/lib/utils"

const SIZE_CLASS = {
  sm: { reference: "text-xs", current: "text-sm" },
  md: { reference: "text-sm", current: "text-base sm:text-[1.0625rem]" },
  lg: { reference: "text-lg md:text-xl", current: "text-2xl md:text-3xl" },
} as const

/**
 * The one place every surface renders a scarf price from — decides discounted vs plain
 * by calling `getReferencePrice(price)` itself, so no call site ever reimplements the
 * `price < REFERENCE_PRICE` check. `price` must always be the real unit price (that's
 * what the threshold applies to); pass `quantity` to scale the DISPLAYED numbers for a
 * cart/checkout line total — the discount test still runs against the unit price.
 */
export function ScarfPrice({
  price,
  quantity = 1,
  size = "md",
  className,
  plainClassName,
}: {
  price: number
  quantity?: number
  size?: "sm" | "md" | "lg"
  className?: string
  /**
   * Extra classes applied ONLY to the plain (non-discounted) price, so each surface can
   * match its pre-existing typography exactly. Never applied to the discounted price —
   * "current price in red" is a fixed rule everywhere, not something a surface overrides.
   */
  plainClassName?: string
}) {
  const referenceUnitPrice = getReferencePrice(price)
  const sizes = SIZE_CLASS[size]

  if (referenceUnitPrice === null) {
    return (
      <span
        className={cn("font-medium tabular-nums text-foreground", sizes.current, plainClassName, className)}
      >
        {formatScarfPrice(price * quantity)}
      </span>
    )
  }

  const referenceTotal = referenceUnitPrice * quantity
  const currentTotal = price * quantity

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-1.5 tabular-nums", className)}>
      <s
        aria-label={`Ancien prix ${referenceTotal} dirhams`}
        className={cn("font-normal text-stone-400 decoration-stone-400/80", sizes.reference)}
      >
        {formatScarfPrice(referenceTotal)}
      </s>
      <span className={cn("font-semibold text-[#e0102a]", sizes.current)}>
        {formatScarfPrice(currentTotal)}
      </span>
    </span>
  )
}
