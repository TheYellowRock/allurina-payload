import type { StorefrontCategory } from "@/lib/getStorefrontCategories"

/** Châles shown in the main nav (order preserved). */
export const CHALES_NAV_SLUGS = [
  "chales-en-fil-de-lin",
  "chales-en-crepe",
  "chales-en-mousseline",
] as const

export type ChalesNavSlug = (typeof CHALES_NAV_SLUGS)[number]

export function isChalesNavSlug(slug: string): slug is ChalesNavSlug {
  return (CHALES_NAV_SLUGS as readonly string[]).includes(slug)
}

export function orderChalesNavCategories(
  categories: StorefrontCategory[],
): StorefrontCategory[] {
  const map = new Map(categories.map((c) => [c.slug, c]))
  const out: StorefrontCategory[] = []
  for (const slug of CHALES_NAV_SLUGS) {
    const c = map.get(slug)
    if (c) out.push(c)
  }
  return out
}
