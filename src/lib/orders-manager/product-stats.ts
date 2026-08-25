import type { OrderStatus } from "./order-status"
import type { OrdersManagerOrder } from "./serialize-order"

/** One order line, flattened out of `items` with its parent order's status/date attached. */
export type ProductLine = {
  productId: string
  title: string
  price: number
  quantity: number
  status: OrderStatus
  createdAt: string
}

export function flattenOrderItems(orders: OrdersManagerOrder[]): ProductLine[] {
  const lines: ProductLine[] = []
  for (const o of orders) {
    for (const item of o.items) {
      lines.push({
        productId: item.productId,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        status: o.status,
        createdAt: o.createdAt,
      })
    }
  }
  return lines
}

export type TopSellerRow = {
  productId: string
  /** Most recent snapshot title seen for this productId. */
  title: string
  /** True when past orders captured a different title snapshot (e.g. the catalog title changed) — surfaced so the operator knows the row is a merge. */
  hasMultipleTitles: boolean
  units: number
  orderCount: number
  /** item.price * item.quantity summed — pre-promo-discount line value, NOT a share of the discounted grandTotal. */
  revenue: number
  unitShare: number
}

export function topSellers(lines: ProductLine[]): TopSellerRow[] {
  type Agg = {
    units: number
    revenue: number
    orderCount: number
    titleLastSeen: Map<string, string>
  }
  const byProduct = new Map<string, Agg>()
  const totalUnits = lines.reduce((s, l) => s + l.quantity, 0)

  for (const line of lines) {
    const agg = byProduct.get(line.productId) ?? {
      units: 0,
      revenue: 0,
      orderCount: 0,
      titleLastSeen: new Map(),
    }
    agg.units += line.quantity
    agg.revenue += line.price * line.quantity
    agg.orderCount += 1
    const prevSeen = agg.titleLastSeen.get(line.title)
    if (!prevSeen || line.createdAt > prevSeen) agg.titleLastSeen.set(line.title, line.createdAt)
    byProduct.set(line.productId, agg)
  }

  const rows: TopSellerRow[] = Array.from(byProduct.entries()).map(([productId, agg]) => {
    let latestTitle = ""
    let latestSeen = ""
    for (const [title, lastSeen] of agg.titleLastSeen) {
      if (lastSeen > latestSeen) {
        latestSeen = lastSeen
        latestTitle = title
      }
    }
    return {
      productId,
      title: latestTitle,
      hasMultipleTitles: agg.titleLastSeen.size > 1,
      units: agg.units,
      orderCount: agg.orderCount,
      revenue: agg.revenue,
      unitShare: totalUnits > 0 ? agg.units / totalUnits : 0,
    }
  })

  rows.sort((a, b) => b.units - a.units)
  return rows
}

export type VelocityRow = { productId: string; title: string; unitsInWindow: number; unitsPerDay: number }

/** Units sold per day over the last `days` days, per product, sorted fastest-moving first. */
export function velocityPerDay(lines: ProductLine[], now: Date = new Date(), days = 30): VelocityRow[] {
  const cutoff = now.getTime() - days * 86_400_000
  type Agg = { units: number; title: string }
  const byProduct = new Map<string, Agg>()

  for (const l of lines) {
    const t = new Date(l.createdAt).getTime()
    if (!Number.isFinite(t) || t < cutoff) continue
    const agg = byProduct.get(l.productId) ?? { units: 0, title: l.title }
    agg.units += l.quantity
    agg.title = l.title
    byProduct.set(l.productId, agg)
  }

  const rows: VelocityRow[] = Array.from(byProduct.entries()).map(([productId, agg]) => ({
    productId,
    title: agg.title,
    unitsInWindow: agg.units,
    unitsPerDay: agg.units / days,
  }))
  rows.sort((a, b) => b.unitsPerDay - a.unitsPerDay)
  return rows
}

export type TrendRow = {
  productId: string
  title: string
  unitsRecent: number
  unitsPrior: number
  /** null when the prior period had zero units — "infinite growth" can't be expressed as a percentage; treat as a new/reappearing product. */
  changePct: number | null
}

/**
 * Last `windowDays` vs the `windowDays` immediately before that, per product. Products
 * with fewer than 3 total units across both periods combined are dropped so a single
 * sale doesn't register as a "300% increase."
 */
export function trending(lines: ProductLine[], now: Date = new Date(), windowDays = 14): TrendRow[] {
  const recentStart = now.getTime() - windowDays * 86_400_000
  const priorStart = now.getTime() - windowDays * 2 * 86_400_000

  type Agg = { recent: number; prior: number; title: string }
  const byProduct = new Map<string, Agg>()

  for (const l of lines) {
    const t = new Date(l.createdAt).getTime()
    if (!Number.isFinite(t) || t < priorStart) continue
    const agg = byProduct.get(l.productId) ?? { recent: 0, prior: 0, title: l.title }
    if (t >= recentStart) agg.recent += l.quantity
    else agg.prior += l.quantity
    agg.title = l.title
    byProduct.set(l.productId, agg)
  }

  const rows: TrendRow[] = []
  for (const [productId, agg] of byProduct) {
    if (agg.recent + agg.prior < 3) continue
    const changePct = agg.prior > 0 ? (agg.recent - agg.prior) / agg.prior : agg.recent > 0 ? null : 0
    rows.push({ productId, title: agg.title, unitsRecent: agg.recent, unitsPrior: agg.prior, changePct })
  }

  // Products with no prior-period baseline (changePct === null) surface first — they're
  // the most dramatic signal ("brand new in the recent window") — then by magnitude.
  rows.sort((a, b) => {
    if (a.changePct === null && b.changePct === null) return b.unitsRecent - a.unitsRecent
    if (a.changePct === null) return -1
    if (b.changePct === null) return 1
    return b.changePct - a.changePct
  })
  return rows
}

export type ProductConfirmationRow = {
  productId: string
  title: string
  matureSampleSize: number
  deliveredCount: number
  cancelledCount: number
  confirmationRate: number | null
  indicative: boolean
}

const MATURITY_DAYS = 14

/** Same delivered/(delivered+cancelled) definition as the headline metric, per product. */
export function productConfirmationRate(
  lines: ProductLine[],
  now: Date = new Date(),
): ProductConfirmationRow[] {
  const cutoff = now.getTime() - MATURITY_DAYS * 86_400_000
  type Agg = { delivered: number; cancelled: number; title: string }
  const byProduct = new Map<string, Agg>()

  for (const l of lines) {
    const t = new Date(l.createdAt).getTime()
    if (!Number.isFinite(t) || t > cutoff) continue
    if (l.status !== "delivered" && l.status !== "cancelled") continue
    const agg = byProduct.get(l.productId) ?? { delivered: 0, cancelled: 0, title: l.title }
    if (l.status === "delivered") agg.delivered += 1
    else agg.cancelled += 1
    agg.title = l.title
    byProduct.set(l.productId, agg)
  }

  return Array.from(byProduct.entries()).map(([productId, agg]) => {
    const matureSampleSize = agg.delivered + agg.cancelled
    return {
      productId,
      title: agg.title,
      matureSampleSize,
      deliveredCount: agg.delivered,
      cancelledCount: agg.cancelled,
      confirmationRate: matureSampleSize > 0 ? agg.delivered / matureSampleSize : null,
      indicative: matureSampleSize < 20,
    }
  })
}
