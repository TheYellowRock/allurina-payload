import { unstable_cache } from "next/cache"
import { cache } from "react"
import { getPayload } from "payload"
import type { Where } from "payload"

import config from "@payload-config"
import { mapDocToStorefrontScarf } from "@/lib/mapStorefrontScarf"
import type { StorefrontScarf } from "@/lib/storefront-scarf-types"

import { getProductTypeId } from "./product-types"

/** Look-back window for "meilleures ventes". */
const WINDOW_DAYS = 90

/**
 * Product ids ranked by units sold over the last 90 days (cancelled orders excluded).
 * Cached for an hour: it scans recent orders, and the homepage is rendered on every visit.
 */
const getRankedProductIds = unstable_cache(
  async (): Promise<string[]> => {
    const payload = await getPayload({ config: await config })
    const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString()
    const orders = await payload.find({
      collection: "orders",
      where: { and: [{ createdAt: { greater_than_equal: since } }, { status: { not_equals: "cancelled" } }] },
      select: { items: true },
      depth: 0,
      limit: 5000,
      pagination: false,
      overrideAccess: true,
    })
    const units = new Map<string, number>()
    for (const order of orders.docs) {
      const items = (order as { items?: unknown }).items
      if (!Array.isArray(items)) continue
      for (const line of items as { productId?: unknown; quantity?: unknown }[]) {
        if (typeof line?.productId !== "string") continue
        units.set(line.productId, (units.get(line.productId) ?? 0) + (Number(line.quantity) || 0))
      }
    }
    return [...units.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
  },
  ["best-sellers-ranked-ids"],
  { revalidate: 3600, tags: ["best-sellers"] },
)

/**
 * Best-selling products of one type that are in stock right now, best first (at most
 * `limit`). When fewer than `minimum` have sold, the newest in-stock products top the
 * rail up to `minimum` — never more, so the rest of the catalogue still has pieces to
 * show below the rail.
 */
export const getBestSellers = cache(async (productTypeSlug: string, limit = 10, minimum = 6): Promise<StorefrontScarf[]> => {
  const payload = await getPayload({ config: await config })
  const typeId = await getProductTypeId(payload, productTypeSlug)
  if (typeId === null) return []

  const inStockOfType: Where[] = [{ stockQuantity: { greater_than: 0 } }, { productType: { equals: typeId } }]
  const ranked = (await getRankedProductIds()).filter((id) => /^\d+$/.test(id)).slice(0, 60)

  const sold = ranked.length
    ? await payload.find({
        collection: "scarves",
        where: { and: [...inStockOfType, { id: { in: ranked } }] },
        depth: 2,
        limit: ranked.length,
        pagination: false,
        overrideAccess: true,
      })
    : null
  const rank = new Map(ranked.map((id, i) => [id, i]))
  const best = (sold?.docs ?? [])
    .sort((a, b) => (rank.get(String(a.id)) ?? 0) - (rank.get(String(b.id)) ?? 0))
    .slice(0, limit)

  if (best.length < minimum) {
    const newest = await payload.find({
      collection: "scarves",
      where: {
        and: [...inStockOfType, ...(best.length ? [{ id: { not_in: best.map((d) => d.id) } }] : [])],
      },
      depth: 2,
      limit: minimum - best.length,
      sort: "-createdAt",
      overrideAccess: true,
    })
    best.push(...newest.docs)
  }

  return best.map((doc) => mapDocToStorefrontScarf(doc as Record<string, unknown>))
})

/** All in-stock products of one type, newest first (the "Voir plus" pages). */
export const getProductsOfType = cache(async (productTypeSlug: string): Promise<StorefrontScarf[]> => {
  const payload = await getPayload({ config: await config })
  const typeId = await getProductTypeId(payload, productTypeSlug)
  if (typeId === null) return []
  const res = await payload.find({
    collection: "scarves",
    where: { and: [{ stockQuantity: { greater_than: 0 } }, { productType: { equals: typeId } }] },
    depth: 2,
    limit: 400,
    sort: "-updatedAt",
    overrideAccess: true,
  })
  return res.docs.map((doc) => mapDocToStorefrontScarf(doc as Record<string, unknown>))
})
