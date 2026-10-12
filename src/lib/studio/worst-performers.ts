import type { ProductLine } from "./product-stats"

/** Fields needed from the scarves collection — a superset of `ScarfRef` (never-sold.ts). */
export type ScarfStockRef = {
  id: string
  title: string
  slug: string
  price: number
  stockQuantity: number
  createdAt: string
}

export type WorstPerformerRow = {
  productId: string
  title: string
  price: number
  unitsInWindow: number
  daysAvailable: number
  /** units per day, over `daysAvailable` — NOT over the raw window length. */
  velocity: number
  totalUnitsAllTime: number
  /** null = never sold, any time, any status. */
  daysSinceLastSale: number | null
  /** Zero sales despite a full window of exposure — the clearest repricing candidate. */
  isZeroSaleCandidate: boolean
}

export type TooRecentRow = {
  productId: string
  title: string
  daysAvailable: number
}

export type WorstPerformersResult = {
  /** Bottom 15 by velocity ascending, among products with >= MIN_DAYS_AVAILABLE exposure. */
  ranked: WorstPerformerRow[]
  /** In-stock products with too little exposure in the window to judge — not ranked. */
  tooRecent: TooRecentRow[]
  /** Median velocity across every in-stock product (including `tooRecent` ones) — context for how far below typical the ranked rows sit. */
  medianVelocity: number
  /** Distinct productIds seen in all-time order history with no matching scarf doc (deleted from the catalog) — excluded from everything above. */
  delistedCount: number
}

const WINDOW_DAYS = 30
const MIN_DAYS_AVAILABLE = 14
const BOTTOM_N = 15
const MS_PER_DAY = 86_400_000

function daysBetween(startMs: number, endMs: number): number {
  return (endMs - startMs) / MS_PER_DAY
}

function median(sortedAsc: number[]): number {
  if (sortedAsc.length === 0) return 0
  const mid = Math.floor(sortedAsc.length / 2)
  return sortedAsc.length % 2 === 0 ? (sortedAsc[mid - 1]! + sortedAsc[mid]!) / 2 : sortedAsc[mid]!
}

/**
 * Ranks in-stock products by sales velocity — units sold in the last 30 days divided by
 * how many of those 30 days the product actually existed for (`max(createdAt, window
 * start)` to window end), not raw units sold. A product listed 5 days ago with 1 sale
 * (velocity 0.20/day) would otherwise look identical to a product listed 30 days ago
 * with 1 sale (velocity 0.03/day) — the raw-units view can't tell "too new to judge"
 * from "genuinely not selling."
 *
 * `allScarves` must be the FULL catalog (any stock level) — needed to tell "out of
 * stock" (excluded from ranking, but still a known scarf) apart from "delisted"
 * (productId in order history with no matching scarf doc at all).
 */
export function worstPerformers(
  allScarves: ScarfStockRef[],
  windowLines: ProductLine[],
  allTimeLines: ProductLine[],
  now: Date = new Date(),
): WorstPerformersResult {
  const windowStart = now.getTime() - WINDOW_DAYS * MS_PER_DAY
  const windowEnd = now.getTime()

  const unitsInWindowByProduct = new Map<string, number>()
  for (const l of windowLines) {
    unitsInWindowByProduct.set(l.productId, (unitsInWindowByProduct.get(l.productId) ?? 0) + l.quantity)
  }

  const totalUnitsByProduct = new Map<string, number>()
  const lastSaleByProduct = new Map<string, number>()
  for (const l of allTimeLines) {
    totalUnitsByProduct.set(l.productId, (totalUnitsByProduct.get(l.productId) ?? 0) + l.quantity)
    const t = new Date(l.createdAt).getTime()
    if (Number.isFinite(t)) {
      const prev = lastSaleByProduct.get(l.productId)
      if (prev === undefined || t > prev) lastSaleByProduct.set(l.productId, t)
    }
  }

  const scarfIds = new Set(allScarves.map((s) => s.id))
  const delistedIds = new Set<string>()
  for (const l of allTimeLines) {
    if (!scarfIds.has(l.productId)) delistedIds.add(l.productId)
  }

  const inStock = allScarves.filter((s) => s.stockQuantity > 0)

  type Computed = {
    productId: string
    title: string
    price: number
    unitsInWindow: number
    daysAvailableExact: number
    velocity: number
    totalUnitsAllTime: number
    daysSinceLastSale: number | null
  }

  const computed: Computed[] = inStock.map((s) => {
    const createdAtMs = new Date(s.createdAt).getTime()
    const effectiveStart = Number.isFinite(createdAtMs) ? Math.max(createdAtMs, windowStart) : windowStart
    const daysAvailableExact = Math.max(0, daysBetween(effectiveStart, windowEnd))
    const unitsInWindow = unitsInWindowByProduct.get(s.id) ?? 0
    const velocity = daysAvailableExact > 0 ? unitsInWindow / daysAvailableExact : 0
    const totalUnitsAllTime = totalUnitsByProduct.get(s.id) ?? 0
    const lastSaleMs = lastSaleByProduct.get(s.id)
    const daysSinceLastSale = lastSaleMs !== undefined ? Math.floor(daysBetween(lastSaleMs, windowEnd)) : null

    return {
      productId: s.id,
      title: s.title,
      price: s.price,
      unitsInWindow,
      daysAvailableExact,
      velocity,
      totalUnitsAllTime,
      daysSinceLastSale,
    }
  })

  const tooRecent: TooRecentRow[] = computed
    .filter((c) => c.daysAvailableExact < MIN_DAYS_AVAILABLE)
    .map((c) => ({ productId: c.productId, title: c.title, daysAvailable: Math.floor(c.daysAvailableExact) }))
    .sort((a, b) => a.daysAvailable - b.daysAvailable)

  const ranked: WorstPerformerRow[] = computed
    .filter((c) => c.daysAvailableExact >= MIN_DAYS_AVAILABLE)
    .sort((a, b) => a.velocity - b.velocity)
    .slice(0, BOTTOM_N)
    .map((c) => ({
      productId: c.productId,
      title: c.title,
      price: c.price,
      unitsInWindow: c.unitsInWindow,
      daysAvailable: Math.floor(c.daysAvailableExact),
      velocity: c.velocity,
      totalUnitsAllTime: c.totalUnitsAllTime,
      daysSinceLastSale: c.daysSinceLastSale,
      isZeroSaleCandidate: c.unitsInWindow === 0 && c.daysAvailableExact >= WINDOW_DAYS,
    }))

  const medianVelocity = median(computed.map((c) => c.velocity).sort((a, b) => a - b))

  return { ranked, tooRecent, medianVelocity, delistedCount: delistedIds.size }
}
