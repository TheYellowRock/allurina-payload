import { Badge } from "@/components/ui/badge"
import { PROMO_LABEL } from "@/lib/pricing/reference-price"
import { cn } from "@/lib/utils"

/**
 * Top-left sibling to the availability badge (which sits top-right — see
 * `availabilityBadgeClassName`). Same size/padding/z-index so the two read as a matched
 * pair and never collide. Caller decides whether to render this at all (based on
 * `getReferencePrice`), so its presence never affects layout for non-discounted cards.
 */
export function PromoBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "pointer-events-none absolute left-2 top-2 z-30 rounded-none border border-black/10 bg-[#e0102a] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white shadow-none sm:left-3 sm:top-3 sm:text-[10px]",
        className,
      )}
    >
      {PROMO_LABEL}
    </Badge>
  )
}
