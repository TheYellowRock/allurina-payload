import { getPayload } from "payload"
import type { Where } from "payload"

import config from "@payload-config"
import { rangeToWhereBounds, resolveDateRange } from "@/lib/orders-manager/date-range"
import { formatDh, formatPercent, formatSignedPercent } from "@/lib/orders-manager/format"
import type { ScarfRef } from "@/lib/orders-manager/never-sold"
import { neverSoldProducts } from "@/lib/orders-manager/never-sold"
import {
  flattenOrderItems,
  productConfirmationRate,
  topSellers,
  trending,
  velocityPerDay,
} from "@/lib/orders-manager/product-stats"
import { serializeOrderDoc } from "@/lib/orders-manager/serialize-order"
import type { OrdersManagerOrder } from "@/lib/orders-manager/serialize-order"
import { firstParam } from "@/lib/orders-manager/tabs"

import { DateRangePicker } from "./date-range-picker"

type SearchParams = Record<string, string | string[] | undefined>

const RANGE_FETCH_LIMIT = 5000
const TOP_N = 20

/** Only status/createdAt/items are read by anything downstream of this tab — the rest of `OrdersManagerOrder`'s fields are left at their zero-value default by `serializeOrderDoc`. */
const PRODUCT_SELECT = { status: true, createdAt: true, items: true } as const

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
    select: PRODUCT_SELECT,
    sort: "-createdAt",
    overrideAccess: true,
  })
  if (res.hasNextPage) {
    console.warn(
      `[orders-manager products] range fetch truncated at ${RANGE_FETCH_LIMIT} docs — figures below are understated`,
    )
  }
  return serializeDocs(res.docs)
}

/** "Never sold" is explicitly all-time per the spec, unlike everything else on this tab — not limited to the selected range. Only `items` is needed. */
async function fetchAllOrderItemsEverSold(
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<OrdersManagerOrder[]> {
  const res = await payload.find({
    collection: "orders",
    depth: 0,
    limit: RANGE_FETCH_LIMIT,
    select: { items: true },
    overrideAccess: true,
  })
  if (res.hasNextPage) {
    console.warn(
      `[orders-manager products] all-time fetch truncated at ${RANGE_FETCH_LIMIT} docs — "never sold" list may be understated`,
    )
  }
  return serializeDocs(res.docs)
}

function ChangeBadge({ changePct }: { changePct: number | null }) {
  if (changePct === null) {
    return <span className="text-xs font-medium text-sky-700">Nouveau</span>
  }
  return (
    <span className={changePct >= 0 ? "text-xs font-medium text-emerald-700" : "text-xs font-medium text-red-700"}>
      {formatSignedPercent(changePct)}
    </span>
  )
}

export async function ProductsTab({ searchParams }: { searchParams: SearchParams }) {
  const resolvedConfig = await config
  const payload = await getPayload({ config: resolvedConfig })

  const range = resolveDateRange({
    range: firstParam(searchParams.range),
    from: firstParam(searchParams.from),
    to: firstParam(searchParams.to),
  })

  const now = new Date()
  const thirtyDaysAgoIso = new Date(now.getTime() - 30 * 86_400_000).toISOString()

  const [rangeOrders, last30Orders, allTimeOrders, scarvesRes] = await Promise.all([
    fetchOrdersInRange(payload, rangeToWhereBounds(range)),
    fetchOrdersInRange(payload, { greater_than_equal: thirtyDaysAgoIso, less_than: now.toISOString() }),
    fetchAllOrderItemsEverSold(payload),
    payload.find({
      collection: "scarves",
      depth: 0,
      limit: 1000,
      select: { title: true, slug: true },
      overrideAccess: true,
    }),
  ])

  const rangeLines = flattenOrderItems(rangeOrders)
  const last30Lines = flattenOrderItems(last30Orders)
  const allTimeLines = flattenOrderItems(allTimeOrders)

  const sellers = topSellers(rangeLines).slice(0, TOP_N)
  const velocity = velocityPerDay(last30Lines, now, 30).slice(0, TOP_N)
  const trend = trending(last30Lines, now, 14).slice(0, TOP_N)
  const confByProduct = new Map(productConfirmationRate(rangeLines, now).map((r) => [r.productId, r]))

  const scarves: ScarfRef[] = scarvesRes.docs.map((d) => {
    const doc = d as Record<string, unknown>
    return { id: String(doc.id), title: String(doc.title ?? ""), slug: String(doc.slug ?? "") }
  })
  const neverSold = neverSoldProducts(scarves, allTimeLines)

  return (
    <section className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Produits</h2>
          <p className="mt-1 text-xs text-stone-500">
            {range.label} · {range.startYmd} → {range.endYmd}
          </p>
        </div>
        <DateRangePicker tab="products" range={range} />
      </div>

      {/* ——— Top sellers ——— */}
      <div>
        <h3 className="text-[11px] font-semibold tracking-[0.18em] text-stone-500 uppercase">
          Meilleures ventes
        </h3>
        <p className="mt-1 text-[11px] text-stone-500">
          Chiffre = prix × quantité au prix catalogue — valeur ligne avant remise palier, pas une part du total remisé.
        </p>
        <div className="mt-3 overflow-x-auto rounded-sm border border-stone-300/90 bg-white shadow-sm">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold tracking-wide text-stone-600 uppercase">
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3 text-right">Unités</th>
                <th className="px-4 py-3 text-right">Part unités</th>
                <th className="px-4 py-3 text-right">Commandes</th>
                <th className="px-4 py-3 text-right">Chiffre (ligne)</th>
                <th className="px-4 py-3 text-right">Confirmation</th>
              </tr>
            </thead>
            <tbody>
              {sellers.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-stone-500" colSpan={6}>
                    Aucune vente pour cette période.
                  </td>
                </tr>
              ) : (
                sellers.map((s) => {
                  const conf = confByProduct.get(s.productId)
                  return (
                    <tr key={s.productId} className="border-b border-stone-100">
                      <td className="px-4 py-3 font-medium text-stone-900">
                        {s.title || "(sans titre)"}
                        {s.hasMultipleTitles ? (
                          <span
                            className="ml-1.5 inline-block size-1.5 rounded-full bg-amber-500 align-middle"
                            title="Le titre a changé au fil des commandes — dernier titre affiché."
                          />
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{s.units}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatPercent(s.unitShare)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{s.orderCount}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatDh(s.revenue)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {conf && conf.confirmationRate !== null ? (
                          <>
                            {formatPercent(conf.confirmationRate)}
                            {conf.indicative ? (
                              <span className="ml-1 text-[10px] text-stone-400">indicatif</span>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ——— Velocity + Trending ——— */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-[11px] font-semibold tracking-[0.18em] text-stone-500 uppercase">
            Vélocité · unités / jour (30 derniers jours)
          </h3>
          <div className="mt-3 overflow-x-auto rounded-sm border border-stone-300/90 bg-white shadow-sm">
            <table className="w-full min-w-[380px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold tracking-wide text-stone-600 uppercase">
                  <th className="px-4 py-3">Produit</th>
                  <th className="px-4 py-3 text-right">Unités/j</th>
                  <th className="px-4 py-3 text-right">Unités (30j)</th>
                </tr>
              </thead>
              <tbody>
                {velocity.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-stone-500" colSpan={3}>
                      Aucune vente sur 30 jours.
                    </td>
                  </tr>
                ) : (
                  velocity.map((v) => (
                    <tr key={v.productId} className="border-b border-stone-100">
                      <td className="px-4 py-3 font-medium text-stone-900">{v.title || "(sans titre)"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{v.unitsPerDay.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{v.unitsInWindow}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-[11px] font-semibold tracking-[0.18em] text-stone-500 uppercase">
            En hausse · 14j vs 14j précédents
          </h3>
          <p className="mt-1 text-[11px] text-stone-500">
            Signal de tendance, pas une prévision. Produits à moins de 3 unités sur la fenêtre exclus.
          </p>
          <div className="mt-3 overflow-x-auto rounded-sm border border-stone-300/90 bg-white shadow-sm">
            <table className="w-full min-w-[380px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold tracking-wide text-stone-600 uppercase">
                  <th className="px-4 py-3">Produit</th>
                  <th className="px-4 py-3 text-right">14j récents</th>
                  <th className="px-4 py-3 text-right">Évolution</th>
                </tr>
              </thead>
              <tbody>
                {trend.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-stone-500" colSpan={3}>
                      Pas assez de données.
                    </td>
                  </tr>
                ) : (
                  trend.map((t) => (
                    <tr key={t.productId} className="border-b border-stone-100">
                      <td className="px-4 py-3 font-medium text-stone-900">{t.title || "(sans titre)"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{t.unitsRecent}</td>
                      <td className="px-4 py-3 text-right">
                        <ChangeBadge changePct={t.changePct} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ——— Never sold ——— */}
      <div>
        <h3 className="text-[11px] font-semibold tracking-[0.18em] text-stone-500 uppercase">
          Jamais vendus
        </h3>
        <p className="mt-1 text-[11px] text-stone-500">
          Toutes commandes confondues, indépendamment de la période sélectionnée ci-dessus.
        </p>
        {neverSold.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">Chaque pièce du catalogue a déjà été vendue au moins une fois.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {neverSold.map((s) => (
              <li
                key={s.id}
                className="rounded-sm border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700"
              >
                {s.title || s.slug}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
