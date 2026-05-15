import type { AvailabilityStatus } from "@/collections/AvailabilityTags"
import { chalesTypeLabel } from "@/lib/navLabels"

export function availabilityBadgeTone(
  status: AvailabilityStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "out_of_stock":
      return "destructive"
    case "low_stock":
      return "outline"
    case "pre_order":
    case "coming_soon":
      return "secondary"
    default:
      return "default"
  }
}

/** Brand availability chips: solid fills + white uppercase labels (use with `Badge variant="outline"` + `className`). */
const availabilityTagText = "font-semibold uppercase tracking-[0.14em] text-white shadow-none"

export function availabilityBadgeClassName(status: AvailabilityStatus): string {
  switch (status) {
    case "in_stock":
      return `border border-black/10 bg-[#53d86a] ${availabilityTagText}`
    case "low_stock":
      return `border border-black/10 bg-[#fe9526] ${availabilityTagText}`
    case "out_of_stock":
      return `border border-black/10 bg-[#fd3d39] ${availabilityTagText}`
    case "pre_order":
      return `border border-black/10 bg-sky-600 ${availabilityTagText}`
    case "coming_soon":
      return `border border-black/10 bg-violet-600 ${availabilityTagText}`
    default:
      return `border border-black/10 bg-stone-700 ${availabilityTagText}`
  }
}

/** Moroccan dirham — displays as localized number + ` Dh` (e.g. `65 Dh`). */
export function formatScarfPrice(value: number): string {
  const hasDecimals = Math.abs(value % 1) > Number.EPSILON
  const n = new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value)
  return `${n} Dh`
}

/** First linked category as a short label (e.g. `Fil De Lin`), or null if missing / not populated. */
export function storefrontPrimaryCategoryLine(categories: unknown): string | null {
  if (!Array.isArray(categories) || categories.length === 0) return null
  const first = categories[0]
  if (!first || typeof first !== "object") return null
  const name = (first as { name?: string }).name
  if (typeof name !== "string" || !name.trim()) return null
  return chalesTypeLabel(name.trim())
}

/** Resolved URL for a populated Payload upload (same-origin). */
export function storefrontMediaUrl(image: unknown): string | null {
  if (!image || typeof image !== "object") return null
  const u = (image as { url?: string }).url
  if (typeof u !== "string" || !u.length) return null
  if (u.startsWith("http://") || u.startsWith("https://")) return u
  return u.startsWith("/") ? u : `/${u}`
}
