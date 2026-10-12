import { shiftYmd, ymdInCasablanca } from "./casablanca-time"
import type { OrderStatus } from "./order-status"
import type { OrdersManagerOrder } from "./serialize-order"

export type RevenueSplit = {
  encaisse: number
  enCours: number
  perdu: number
  total: number
}

const EN_COURS_STATUSES: readonly OrderStatus[] = ["pending", "confirmed", "packing", "shipped"]

/**
 * Revenue split by CURRENT status — never blended into one number. `total` is the sum of
 * the three buckets by construction (every status maps to exactly one bucket), so it's
 * always exactly the total of all orders passed in.
 */
export function splitRevenueByStatus(orders: OrdersManagerOrder[]): RevenueSplit {
  let encaisse = 0
  let enCours = 0
  let perdu = 0
  for (const o of orders) {
    if (o.status === "delivered") encaisse += o.grandTotal
    else if (o.status === "cancelled") perdu += o.grandTotal
    else if (EN_COURS_STATUSES.includes(o.status)) enCours += o.grandTotal
  }
  return { encaisse, enCours, perdu, total: encaisse + enCours + perdu }
}

export type DeliveredStats = { count: number; averageOrderValue: number }

export function deliveredOrderStats(orders: OrdersManagerOrder[]): DeliveredStats {
  const delivered = orders.filter((o) => o.status === "delivered")
  const count = delivered.length
  const sum = delivered.reduce((s, o) => s + o.grandTotal, 0)
  return { count, averageOrderValue: count > 0 ? sum / count : 0 }
}

export type ConfirmationRate = { rate: number | null; sampleSize: number; indicative: boolean }

const MATURITY_DAYS = 14

/** delivered / (delivered + cancelled), restricted to orders old enough to have a settled outcome. */
export function confirmationRate(orders: OrdersManagerOrder[], now: Date = new Date()): ConfirmationRate {
  const cutoff = now.getTime() - MATURITY_DAYS * 86_400_000
  const mature = orders.filter((o) => {
    const t = new Date(o.createdAt).getTime()
    return Number.isFinite(t) && t <= cutoff && (o.status === "delivered" || o.status === "cancelled")
  })
  const delivered = mature.filter((o) => o.status === "delivered").length
  const sampleSize = mature.length
  return {
    rate: sampleSize > 0 ? delivered / sampleSize : null,
    sampleSize,
    indicative: sampleSize < 20,
  }
}

export type PeriodComparison = { current: number; previous: number; delta: number; deltaPct: number | null }

export function comparePeriodValue(current: number, previous: number): PeriodComparison {
  const delta = current - previous
  const deltaPct = previous !== 0 ? delta / previous : current !== 0 ? null : 0
  return { current, previous, delta, deltaPct }
}

export type DailyRevenuePoint = { ymd: string; revenue: number; orderCount: number }

/**
 * Daily "business placed" revenue — every non-cancelled order's grandTotal on its
 * createdAt day. This is distinct from the encaissé/en-cours/perdu split above (which
 * classifies by *current* status): this tracks day-to-day sales trend regardless of
 * where each order currently sits in the pipeline. Every day in [startYmd, endYmd] gets
 * an entry (0/0 if nothing happened that day) — the series is never gappy.
 */
export function dailyRevenueSeries(
  orders: OrdersManagerOrder[],
  startYmd: string,
  endYmd: string,
): DailyRevenuePoint[] {
  const byDay = new Map<string, { revenue: number; orderCount: number }>()
  for (const o of orders) {
    if (o.status === "cancelled") continue
    const ymd = ymdInCasablanca(new Date(o.createdAt))
    const entry = byDay.get(ymd) ?? { revenue: 0, orderCount: 0 }
    entry.revenue += o.grandTotal
    entry.orderCount += 1
    byDay.set(ymd, entry)
  }

  const points: DailyRevenuePoint[] = []
  let cursor = startYmd
  for (let i = 0; i < 400; i++) {
    const entry = byDay.get(cursor)
    points.push({ ymd: cursor, revenue: entry?.revenue ?? 0, orderCount: entry?.orderCount ?? 0 })
    if (cursor === endYmd) break
    cursor = shiftYmd(cursor, 1)
  }
  return points
}
