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

/** Boutique-style badge colors (use with `Badge variant="outline"` + `className`). */
export function availabilityBadgeClassName(status: AvailabilityStatus): string {
  switch (status) {
    case "in_stock":
      return "border-emerald-800/70 bg-emerald-950 text-white"
    case "low_stock":
      return "border-amber-500/60 bg-amber-100 text-amber-950"
    case "out_of_stock":
      return "border-red-700/60 bg-red-700 text-white"
    case "pre_order":
      return "border-sky-700/60 bg-sky-950 text-sky-50"
    case "coming_soon":
      return "border-violet-500/60 bg-violet-100 text-violet-950"
    default:
      return "border-stone-600/50 bg-stone-900 text-white"
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
