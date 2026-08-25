import type { OrdersManagerOrder } from "./serialize-order"

export function normalizeCityKey(city: string): string {
  return city.trim().toLowerCase().replace(/\s+/g, " ")
}

export type CityConfirmationStats = {
  cityKey: string
  /** Most common original spelling seen for this normalized key. */
  displayCity: string
  orderCount: number
  matureSampleSize: number
  deliveredCount: number
  cancelledCount: number
  confirmationRate: number | null
  indicative: boolean
}

const MATURITY_DAYS = 14

/** Top cities by order volume, each with a confirmation rate computed the same way as the headline metric (14-day-mature delivered/cancelled only). */
export function confirmationRateByCity(
  orders: OrdersManagerOrder[],
  now: Date = new Date(),
  topN = 10,
): CityConfirmationStats[] {
  const cutoff = now.getTime() - MATURITY_DAYS * 86_400_000

  type Agg = {
    orderCount: number
    delivered: number
    cancelled: number
    spellingCounts: Map<string, number>
  }
  const byCity = new Map<string, Agg>()

  for (const o of orders) {
    const key = normalizeCityKey(o.city)
    if (!key) continue
    const agg = byCity.get(key) ?? { orderCount: 0, delivered: 0, cancelled: 0, spellingCounts: new Map() }
    agg.orderCount += 1
    agg.spellingCounts.set(o.city, (agg.spellingCounts.get(o.city) ?? 0) + 1)
    const createdAtMs = new Date(o.createdAt).getTime()
    if (Number.isFinite(createdAtMs) && createdAtMs <= cutoff) {
      if (o.status === "delivered") agg.delivered += 1
      else if (o.status === "cancelled") agg.cancelled += 1
    }
    byCity.set(key, agg)
  }

  const rows: CityConfirmationStats[] = Array.from(byCity.entries()).map(([cityKey, agg]) => {
    let displayCity = cityKey
    let bestCount = -1
    for (const [spelling, count] of agg.spellingCounts) {
      if (count > bestCount) {
        bestCount = count
        displayCity = spelling
      }
    }
    const matureSampleSize = agg.delivered + agg.cancelled
    return {
      cityKey,
      displayCity,
      orderCount: agg.orderCount,
      matureSampleSize,
      deliveredCount: agg.delivered,
      cancelledCount: agg.cancelled,
      confirmationRate: matureSampleSize > 0 ? agg.delivered / matureSampleSize : null,
      indicative: matureSampleSize < 20,
    }
  })

  rows.sort((a, b) => b.orderCount - a.orderCount)
  return rows.slice(0, topN)
}
