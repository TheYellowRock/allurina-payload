import type { OrderStatus } from "@/lib/orders-manager/order-status"
import { ORDER_STATUSES } from "@/lib/orders-manager/order-status"
import type { OrdersManagerOrder } from "@/lib/orders-manager/serialize-order"

/** Business timezone for daily / weekly / monthly buckets */
export const CRM_STATS_TIMEZONE = "Africa/Casablanca"

export type CrmPeriodStats = {
  orderCount: number
  unitsSold: number
  revenueDh: number
}

export type CrmOverview = {
  today: CrmPeriodStats
  week: CrmPeriodStats
  month: CrmPeriodStats
}

export type ClientInsightRow = {
  email: string
  displayName: string | null
  phone: string | null
  clientId: string | null
  orderCount: number
  lifetimeValueDh: number
  lastOrderAt: string | null
}

export type SerializedClientDoc = {
  id: string
  email: string
  fullName: string | null
  phone: string | null
}

export function serializeClientDoc(doc: Record<string, unknown>): SerializedClientDoc | null {
  const id = doc.id
  if (id === undefined || id === null) return null
  const email = doc.email
  if (typeof email !== "string" || !email.trim()) return null
  return {
    id: String(id),
    email: email.trim(),
    fullName: typeof doc.fullName === "string" ? doc.fullName : null,
    phone: typeof doc.phone === "string" ? doc.phone : null,
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function ymdInCasablanca(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CRM_STATS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d)
  const y = parts.find((p) => p.type === "year")?.value
  const m = parts.find((p) => p.type === "month")?.value
  const day = parts.find((p) => p.type === "day")?.value
  if (!y || !m || !day) return ""
  return `${y}-${m}-${day}`
}

function shiftYmd(ymd: string, deltaDays: number): string {
  const [year, mo, d] = ymd.split("-").map(Number)
  const utcNoon = Date.UTC(year, mo - 1, d, 12, 0, 0)
  const shifted = new Date(utcNoon + deltaDays * 86400000)
  return ymdInCasablanca(shifted)
}

function unitsForOrder(o: OrdersManagerOrder): number {
  return o.items.reduce((sum, line) => sum + line.quantity, 0)
}

function emptyPeriod(): CrmPeriodStats {
  return { orderCount: 0, unitsSold: 0, revenueDh: 0 }
}

/** Revenue / units exclude cancelled orders; buckets use calendar day in Casablanca. */
export function computeCrmOverview(orders: OrdersManagerOrder[]): CrmOverview {
  const todayYmd = ymdInCasablanca(new Date())
  const weekYmhds = new Set<string>()
  for (let i = 0; i < 7; i++) weekYmhds.add(shiftYmd(todayYmd, -i))
  const monthPrefix = todayYmd.slice(0, 7)

  const today = emptyPeriod()
  const week = emptyPeriod()
  const month = emptyPeriod()

  for (const o of orders) {
    if (o.status === "cancelled") continue
    const oy = ymdInCasablanca(new Date(o.createdAt))
    if (!oy) continue
    const units = unitsForOrder(o)
    const rev = o.grandTotal

    if (oy === todayYmd) {
      today.orderCount += 1
      today.unitsSold += units
      today.revenueDh += rev
    }
    if (weekYmhds.has(oy)) {
      week.orderCount += 1
      week.unitsSold += units
      week.revenueDh += rev
    }
    if (oy.startsWith(monthPrefix)) {
      month.orderCount += 1
      month.unitsSold += units
      month.revenueDh += rev
    }
  }

  return { today, week, month }
}

/** Order counts by status over the last `days` calendar days (Casablanca). */
export function statusCountsLastDays(
  orders: OrdersManagerOrder[],
  days: number,
): Record<OrderStatus, number> {
  const counts = Object.fromEntries(
    ORDER_STATUSES.map((s) => [s, 0]),
  ) as Record<OrderStatus, number>

  const todayYmd = ymdInCasablanca(new Date())
  const windowYmhds = new Set<string>()
  for (let i = 0; i < days; i++) windowYmhds.add(shiftYmd(todayYmd, -i))

  for (const o of orders) {
    const oy = ymdInCasablanca(new Date(o.createdAt))
    if (!windowYmhds.has(oy)) continue
    counts[o.status] += 1
  }

  return counts
}

function newerIso(a: string | null, b: string): string {
  if (!a) return b
  return new Date(b).getTime() > new Date(a).getTime() ? b : a
}

/** Merge Payload `clients` with aggregates from paid pipeline orders (cancelled excluded). */
export function buildClientInsights(
  orders: OrdersManagerOrder[],
  clients: SerializedClientDoc[],
): ClientInsightRow[] {
  type Agg = {
    orderCount: number
    lifetimeValueDh: number
    lastOrderAt: string | null
    lastName: string | null
    lastPhone: string | null
  }

  const byEmail = new Map<string, Agg>()

  for (const o of orders) {
    if (o.status === "cancelled") continue
    const email = normalizeEmail(o.email)
    if (!email) continue
    const prev = byEmail.get(email)
    const next: Agg = prev ?? {
      orderCount: 0,
      lifetimeValueDh: 0,
      lastOrderAt: null,
      lastName: null,
      lastPhone: null,
    }
    next.orderCount += 1
    next.lifetimeValueDh += o.grandTotal
    next.lastOrderAt = newerIso(next.lastOrderAt, o.createdAt)
    next.lastName = o.customerName?.trim() || next.lastName
    next.lastPhone = o.phone?.trim() || next.lastPhone
    byEmail.set(email, next)
  }

  const rows: ClientInsightRow[] = []
  const seen = new Set<string>()

  for (const c of clients) {
    const email = normalizeEmail(c.email)
    if (!email) continue
    seen.add(email)
    const agg = byEmail.get(email)
    rows.push({
      email,
      clientId: c.id,
      displayName: c.fullName?.trim() || agg?.lastName || null,
      phone: c.phone?.trim() || agg?.lastPhone || null,
      orderCount: agg?.orderCount ?? 0,
      lifetimeValueDh: agg?.lifetimeValueDh ?? 0,
      lastOrderAt: agg?.lastOrderAt ?? null,
    })
  }

  for (const [email, agg] of byEmail) {
    if (seen.has(email)) continue
    rows.push({
      email,
      clientId: null,
      displayName: agg.lastName,
      phone: agg.lastPhone,
      orderCount: agg.orderCount,
      lifetimeValueDh: agg.lifetimeValueDh,
      lastOrderAt: agg.lastOrderAt,
    })
  }

  rows.sort((a, b) => b.lifetimeValueDh - a.lifetimeValueDh || b.orderCount - a.orderCount)

  return rows
}
