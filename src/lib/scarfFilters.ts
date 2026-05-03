import type { StorefrontScarf } from "@/lib/storefront-scarf-types"

export type RelationFacet = { slug: string; name: string }

export function populatedRelations(raw: unknown): RelationFacet[] {
  if (!raw || !Array.isArray(raw)) return []
  const out: RelationFacet[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const o = item as Record<string, unknown>
    const slug = o.slug
    const name = o.name
    if (typeof slug !== "string" || !slug.length) continue
    out.push({ slug, name: typeof name === "string" ? name : slug })
  }
  return out
}

export function scarfBelongsToCollection(
  scarf: StorefrontScarf,
  collectionSlug: string,
): boolean {
  return populatedRelations(scarf.collections).some((r) => r.slug === collectionSlug)
}

export function scarfBelongsToCategorySlug(
  scarf: StorefrontScarf,
  categorySlug: string,
): boolean {
  return populatedRelations(scarf.categories).some((r) => r.slug === categorySlug)
}
