/**
 * Catalogue filter chips (Tous · Unis · À motifs · Lin · Crêpe…) — client-safe part:
 * the chip shape, the query-string encoding shared with `/api/public/scarves`, and the
 * in-memory matcher used by pages that already hold the full list (/chales).
 *
 * A chip matches a product when the product has ANY of the chip's tags or categories
 * (both are slugs). "Unis" is the `solid` tag or the `chales-unis` category, so it works
 * whichever of the two the product was classified with.
 */

export type FilterChip = {
  /** Stable key, also used in the URL (`?filtre=lin`). */
  key: string
  label: string
  tags: string[]
  categories: string[]
  /** In-stock products matching the chip (chips with 0 are never sent). */
  count: number
}

export const ALL_FILTER_KEY = "tous"

/** Query params understood by `/api/public/scarves`. */
export function chipQueryParams(chip: FilterChip | null): Record<string, string> {
  if (!chip) return {}
  const out: Record<string, string> = {}
  if (chip.tags.length) out.tags = chip.tags.join(",")
  if (chip.categories.length) out.categories = chip.categories.join(",")
  return out
}

function slugsOf(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const item of value) {
    if (item && typeof item === "object" && typeof (item as { slug?: unknown }).slug === "string") {
      out.push((item as { slug: string }).slug)
    }
  }
  return out
}

/** For populated (`depth ≥ 1`) products. */
export function productMatchesChip(product: { tags: unknown; categories: unknown }, chip: FilterChip | null): boolean {
  if (!chip) return true
  const tags = slugsOf(product.tags)
  const categories = slugsOf(product.categories)
  return chip.tags.some((t) => tags.includes(t)) || chip.categories.some((c) => categories.includes(c))
}

/** Only lowercase slugs, max 10 per list — anything else is dropped. */
export function parseSlugList(raw: string | null): string[] {
  if (!raw) return []
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-z0-9-]{1,60}$/.test(s))
    .slice(0, 10)
}
