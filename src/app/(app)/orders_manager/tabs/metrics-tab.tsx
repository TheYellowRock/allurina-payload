import { getPayload } from "payload"
import type { Where } from "payload"

import config from "@payload-config"
import { confirmationRateByCity } from "@/lib/orders-manager/city-stats"
import { ESTIMATED_UNIT_COST } from "@/lib/orders-manager/cost-config"
import { previousEquivalentRange, rangeToWhereBounds, resolveDateRange } from "@/lib/orders-manager/date-range"
import { formatDh, formatPercent, formatSignedPercent } from "@/lib/orders-manager/format"
import { estimateAggregateMargin } from "@/lib/orders-manager/margin"
import {
  comparePeriodValue,
  confirmationRate,
  dailyRevenueSeries,
  deliveredOrderStats,
  splitRevenueByStatus,
} from "@/lib/orders-manager/revenue-stats"
import type { PeriodComparison } from "@/lib/orders-manager/revenue-stats"
import { repeatRateByPhone } from "@/lib/orders-manager/repeat-rate"
import { serializeOrderDoc } from "@/lib/orders-manager/serialize-order"
import type { OrdersManagerOrder } from "@/lib/orders-manager/serialize-order"
import { firstParam } from "@/lib/orders-manager/tabs"
import { tierMix } from "@/lib/orders-manager/tier-mix"

import { DailyRevenueChart } from "./daily-revenue-chart"
import { DateRangePicker } from "./date-range-picker"

type SearchParams = Record<string, string | string[] | undefined>

/** Defensive cap — comfortably above current + 10x order volume for any realistic single date range. */
const RANGE_FETCH_LIMIT = 5000
const INDICATIVE_SAMPLE_THRESHOLD = 20

function serializeDocs(docs: unknown[]): OrdersManagerOrder[] {
  return docs
    .map((d) => serializeOrderDoc(d as Record<string, unknown>))
    .filter((o): o is OrdersManagerOrder => o != null)
}

async function fetchOrdersInRange(
  payload: Awaited<ReturnType<typeof getPayload>>,
  bounds: { greater_than_equal: string; less_than: string },
): Promise<OrdersManagerOrder[]> {
  const where: Where = { createdAt: bounds }
  const res = await payload.find({
    collection: "orders",
    where,
    depth: 0,
    limit: RANGE_FETCH_LIMIT,
    sort: "-createdAt",
    overrideAccess: true,
  })
  if (res.hasNextPage) {
    console.warn(
      `[orders-manager metrics] range fetch truncated at ${RANGE_FETCH_LIMIT} docs — figures below are understated`,
    )
  }
  return serializeDocs(res.docs)
}

/** Small "indicatif" marker for any figure resting on a sample under 20 — same threshold as confirmation rate. */
function IndicativeTag({ sampleSize }: { sampleSize: number }) {
  if (sampleSize >= INDICATIVE_SAMPLE_THRESHOLD) return null
  return <span className="ml-1 text-[10px] text-stone-400">indicatif</span>
}

function DeltaBadge({
  comparison,
  formatValue,
  unitLabel,
}: {
  comparison: PeriodComparison
  formatValue: (n: number) => string
  unitLabel: string
}) {
  if (comparison.deltaPct === null) {
    return <span className="text-xs text-stone-400">—</span>
  }
  return (
    <span
      className={comparison.deltaPct >= 0 ? "text-xs font-medium text-emerald-700" : "text-xs font-medium text-red-700"}
      title={`${formatValue(comparison.current)} vs ${formatValue(comparison.previous)} (période précédente) · ${unitLabel}`}
    >
      {formatSignedPercent(comparison.deltaPct)}
    </span>
  )
}

export async function MetricsTab({ searchParams }: { searchParams: SearchParams }) {
  const resolvedConfig = await config
  const payload = await getPayload({ config: resolvedConfig })

  const range = resolveDateRange({
    range: firstParam(searchParams.range),
    from: firstParam(searchParams.from),
    to: firstParam(searchParams.to),
  })
  const previousRange = previousEquivalentRange(range)

  const [orders, previousOrders] = await Promise.all([
    fetchOrdersInRange(payload, rangeToWhereBounds(range)),
    fetchOrdersInRange(payload, rangeToWhereBounds(previousRange)),
  ])

  const now = new Date()
  const revenue = splitRevenueByStatus(orders)
  const delivered = deliveredOrderStats(orders)
  const confRate = confirmationRate(orders, now)
  const dailySeries = dailyRevenueSeries(orders, range.startYmd, range.endYmd)
  const tiers = tierMix(orders)
  const cities = confirmationRateByCity(orders, now)
  const repeat = repeatRateByPhone(orders)

  const deliveredOrders = orders.filter((o) => o.status === "delivered")
  const marginAgg = estimateAggregateMargin(deliveredOrders, ESTIMATED_UNIT_COST)

  const placedTotal = dailySeries.reduce((s, p) => s + p.revenue, 0)
  const previousPlacedTotal = previousOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.grandTotal, 0)
  const previousEncaisse = splitRevenueByStatus(previousOrders).encaisse

  const placedComparison = comparePeriodValue(placedTotal, previousPlacedTotal)
  const orderCountComparison = comparePeriodValue(orders.length, previousOrders.length)
  const encaisseComparison = comparePeriodValue(revenue.encaisse, previousEncaisse)

  return (
    <section className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Métriques</h2>
          <p className="mt-1 text-xs text-stone-500">
            {range.label} · {range.startYmd} → {range.endYmd}
          </p>
        </div>
        <DateRangePicker tab="metrics" range={range} />
      </div>

      {/* ——— Revenue split — never blended. Sticky: stays visible while scrolling the rest of the tab. ——— */}
      <div className="sticky top-14 z-10 -mx-4 bg-[#f4f3f0] px-4 pt-2 pb-4 md:-mx-6 md:px-6">
        <h3 className="text-[11px] font-semibold tracking-[0.18em] text-stone-500 uppercase">
          Chiffre d’affaires par statut
        </h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div className="rounded-sm border border-stone-300/90 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-stone-500">Encaissé (livrées)</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-800">{formatDh(revenue.encaisse)}</p>
            <div className="mt-2 flex items-center gap-2">
              <DeltaBadge comparison={encaisseComparison} formatValue={formatDh} unitLabel="encaissé" />
              <span className="text-[11px] text-stone-400">vs période précédente</span>
            </div>
          </div>
          <div className="rounded-sm border border-stone-300/90 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-stone-500">En cours (pending → shipped)</p>
            <p className="mt-2 text-2xl font-semibold text-sky-800">{formatDh(revenue.enCours)}</p>
          </div>
          <div className="rounded-sm border border-stone-300/90 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-stone-500">Perdu (annulées)</p>
            <p className="mt-2 text-2xl font-semibold text-red-800">{formatDh(revenue.perdu)}</p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-stone-500">
          Total commandes de la période : {formatDh(revenue.total)}
        </p>
      </div>

      {/* ——— Delivered stats + confirmation rate ——— */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-sm border border-stone-300/90 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-stone-500">Commandes livrées</p>
          <p className="mt-2 text-2xl font-semibold text-stone-900">{delivered.count}</p>
          <div className="mt-2 flex items-center gap-2">
            <DeltaBadge comparison={orderCountComparison} formatValue={(n) => String(n)} unitLabel="commandes" />
            <span className="text-[11px] text-stone-400">commandes totales vs période précédente</span>
          </div>
        </div>
        <div className="rounded-sm border border-stone-300/90 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-stone-500">
            Panier moyen (livrées)
            <IndicativeTag sampleSize={delivered.count} />
          </p>
          <p className="mt-2 text-2xl font-semibold text-stone-900">{formatDh(delivered.averageOrderValue)}</p>
        </div>
        <div className="rounded-sm border border-stone-300/90 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-stone-500">Taux de confirmation</p>
          <p className="mt-2 text-2xl font-semibold text-stone-900">
            {confRate.rate !== null ? formatPercent(confRate.rate) : "—"}
          </p>
          <p className="mt-2 text-[11px] text-stone-500">
            {confRate.sampleSize} commande{confRate.sampleSize > 1 ? "s" : ""} de +14j
            {confRate.indicative ? " · indicatif (échantillon < 20)" : ""}
          </p>
        </div>
      </div>

      {/* ——— Estimated margin (delivered orders, only when a unit cost is configured) ——— */}
      {marginAgg ? (
        <div>
          <h3 className="text-[11px] font-semibold tracking-[0.18em] text-stone-500 uppercase">
            Marge estimée (livrées)
            <span
              className="ml-1.5 cursor-help text-stone-400"
              title="Basée sur un coût unitaire manuel (ESTIMATED_UNIT_COST), pas un COGS enregistré."
            >
              ⓘ
            </span>
            <IndicativeTag sampleSize={marginAgg.orderCount} />
          </h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div className="rounded-sm border border-stone-300/90 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-stone-500">Coût estimé</p>
              <p className="mt-2 text-2xl font-semibold text-stone-900">{formatDh(marginAgg.totalEstimatedCost)}</p>
            </div>
            <div className="rounded-sm border border-stone-300/90 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-stone-500">Marge estimée</p>
              <p className="mt-2 text-2xl font-semibold text-stone-900">{formatDh(marginAgg.totalEstimatedMargin)}</p>
            </div>
            <div className="rounded-sm border border-stone-300/90 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-stone-500">Marge %</p>
              <p className="mt-2 text-2xl font-semibold text-stone-900">
                {marginAgg.marginPct !== null ? formatPercent(marginAgg.marginPct) : "—"}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* ——— Daily revenue ——— */}
      <div>
        <div className="flex items-end justify-between gap-4">
          <h3 className="text-[11px] font-semibold tracking-[0.18em] text-stone-500 uppercase">
            Chiffre d’affaires par jour (hors annulées)
          </h3>
          <div className="flex items-center gap-2">
            <DeltaBadge comparison={placedComparison} formatValue={formatDh} unitLabel="CA placé" />
            <span className="text-[11px] text-stone-400">
              {formatDh(placedComparison.current)} vs {formatDh(placedComparison.previous)} période précédente
            </span>
          </div>
        </div>
        <div className="mt-3 rounded-sm border border-stone-300/90 bg-white p-5 shadow-sm">
          <DailyRevenueChart points={dailySeries} />
        </div>
      </div>

      {/* ——— Tier mix ——— */}
      <div>
        <h3 className="text-[11px] font-semibold tracking-[0.18em] text-stone-500 uppercase">
          Répartition par palier
        </h3>
        <div className="mt-3 overflow-x-auto rounded-sm border border-stone-300/90 bg-white shadow-sm">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold tracking-wide text-stone-600 uppercase">
                <th className="px-4 py-3">Palier</th>
                <th className="px-4 py-3 text-right">Commandes</th>
                <th className="px-4 py-3 text-right">Part</th>
                <th className="px-4 py-3 text-right">Panier moyen</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t) => (
                <tr key={t.bucket} className="border-b border-stone-100">
                  <td className="px-4 py-3 font-medium text-stone-900">
                    {t.bucket === "1" ? "1 article" : t.bucket === "6+" ? "6 articles et +" : `${t.bucket} articles`}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{t.count}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatPercent(t.share)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatDh(t.averageGrandTotal)}
                    <IndicativeTag sampleSize={t.count} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ——— City confirmation rate ——— */}
      <div>
        <h3 className="text-[11px] font-semibold tracking-[0.18em] text-stone-500 uppercase">
          Taux de confirmation par ville · top 10
        </h3>
        <div className="mt-3 overflow-x-auto rounded-sm border border-stone-300/90 bg-white shadow-sm">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold tracking-wide text-stone-600 uppercase">
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3 text-right">Commandes</th>
                <th className="px-4 py-3 text-right">Taux confirmation</th>
                <th className="px-4 py-3 text-right">Échantillon (+14j)</th>
              </tr>
            </thead>
            <tbody>
              {cities.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-stone-500" colSpan={4}>
                    Aucune donnée pour cette période.
                  </td>
                </tr>
              ) : (
                cities.map((c) => (
                  <tr key={c.cityKey} className="border-b border-stone-100">
                    <td className="px-4 py-3 font-medium text-stone-900">{c.displayCity}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.orderCount}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {c.confirmationRate !== null ? formatPercent(c.confirmationRate) : "—"}
                      {c.confirmationRate !== null ? <IndicativeTag sampleSize={c.matureSampleSize} /> : null}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-stone-500">{c.matureSampleSize}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ——— Repeat rate ——— */}
      <div>
        <h3 className="text-[11px] font-semibold tracking-[0.18em] text-stone-500 uppercase">
          Clients récurrents
          <IndicativeTag sampleSize={repeat.totalOrders} />
        </h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div className="rounded-sm border border-stone-300/90 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-stone-500">Part des commandes récurrentes</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">{formatPercent(repeat.repeatShare)}</p>
          </div>
          <div className="rounded-sm border border-stone-300/90 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-stone-500">Nouveaux clients</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">{repeat.newCustomers}</p>
          </div>
          <div className="rounded-sm border border-stone-300/90 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-stone-500">Clients récurrents</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">{repeat.returningCustomers}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
