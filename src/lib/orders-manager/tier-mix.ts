import type { OrdersManagerOrder } from "./serialize-order"

export type TierBucketKey = "1" | "2" | "3" | "4" | "5" | "6+"
const TIER_BUCKET_KEYS: TierBucketKey[] = ["1", "2", "3", "4", "5", "6+"]

export type TierBucketStats = {
  bucket: TierBucketKey
  count: number
  share: number
  averageGrandTotal: number
}

/** Exhaustive: every possible total quantity (including the 0-item edge case) maps to exactly one bucket. */
function bucketFor(totalQty: number): TierBucketKey {
  if (totalQty >= 6) return "6+"
  if (totalQty <= 1) return "1"
  return String(totalQty) as TierBucketKey
}

/** Buckets orders by total item quantity — measures whether the promo ladder (2-5 bundle tiers) is working. */
export function tierMix(orders: OrdersManagerOrder[]): TierBucketStats[] {
  const totals = new Map<TierBucketKey, { count: number; sum: number }>()
  for (const key of TIER_BUCKET_KEYS) totals.set(key, { count: 0, sum: 0 })

  for (const o of orders) {
    const qty = o.items.reduce((sum, line) => sum + line.quantity, 0)
    const entry = totals.get(bucketFor(qty))!
    entry.count += 1
    entry.sum += o.grandTotal
  }

  const totalOrders = orders.length
  return TIER_BUCKET_KEYS.map((bucket) => {
    const { count, sum } = totals.get(bucket)!
    return {
      bucket,
      count,
      share: totalOrders > 0 ? count / totalOrders : 0,
      averageGrandTotal: count > 0 ? sum / count : 0,
    }
  })
}
