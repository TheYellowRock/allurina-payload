import type { Payload } from "payload"

import type { AvailabilityStatus } from "@/collections/AvailabilityTags"

/** Stock strictly below this → badge « stock limité » (when a matching tag exists in CMS). */
export const LOW_STOCK_THRESHOLD = 5

function aggregateLineQuantities(items: unknown): Map<string, number> {
  const map = new Map<string, number>()
  if (!Array.isArray(items)) return map
  for (const row of items) {
    if (!row || typeof row !== "object") continue
    const o = row as Record<string, unknown>
    const id = o.productId
    const qty = typeof o.quantity === "number" ? Math.floor(o.quantity) : 0
    if (typeof id !== "string" && typeof id !== "number") continue
    if (!Number.isFinite(qty) || qty < 1) continue
    const key = String(id)
    map.set(key, (map.get(key) ?? 0) + qty)
  }
  return map
}

async function findAvailabilityTagId(
  payload: Payload,
  status: AvailabilityStatus,
): Promise<string | number | null> {
  try {
    const res = await payload.find({
      collection: "availability-tags",
      where: { status: { equals: status } },
      limit: 1,
      depth: 0,
    })
    const id = res.docs[0]?.id
    if (id === undefined || id === null) return null
    return id as string | number
  } catch {
    return null
  }
}

/**
 * Decrements `scarves.stockQuantity` for each cart line on a newly created order,
 * then syncs `availabilityTags` when stock crosses simple thresholds (requires matching
 * `availability-tags` rows in Payload — see seed).
 */
export async function adjustInventoryForNewOrder(
  payload: Payload,
  orderDoc: Record<string, unknown>,
): Promise<void> {
  const byProduct = aggregateLineQuantities(orderDoc.items)
  if (byProduct.size === 0) return

  const tagLow = await findAvailabilityTagId(payload, "low_stock")
  const tagOut = await findAvailabilityTagId(payload, "out_of_stock")
  const tagIn = await findAvailabilityTagId(payload, "in_stock")

  for (const [productId, qtyOrdered] of byProduct) {
    let scarf: { id: string | number; stockQuantity?: unknown } | null = null
    try {
      scarf = await payload.findByID({
        collection: "scarves",
        id: productId,
        depth: 0,
      })
    } catch {
      console.warn(`[inventory] scarf not found for productId=${productId}`)
      continue
    }
    if (!scarf) continue

    const current =
      typeof scarf.stockQuantity === "number" && Number.isFinite(scarf.stockQuantity)
        ? scarf.stockQuantity
        : 0
    const next = Math.max(0, current - qtyOrdered)

    let availabilityTags: (string | number)[] | undefined
    if (next <= 0 && tagOut != null) {
      availabilityTags = [tagOut]
    } else if (next < LOW_STOCK_THRESHOLD && next > 0 && tagLow != null) {
      availabilityTags = [tagLow]
    } else if (next >= LOW_STOCK_THRESHOLD && tagIn != null) {
      availabilityTags = [tagIn]
    }

    const data: {
      stockQuantity: number
      availabilityTags?: (string | number)[]
    } = { stockQuantity: next }
    if (availabilityTags !== undefined) {
      data.availabilityTags = availabilityTags
    }

    await payload.update({
      collection: "scarves",
      id: scarf.id,
      data,
      overrideAccess: true,
    })
  }
}
