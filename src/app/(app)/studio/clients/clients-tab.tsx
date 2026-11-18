import Link from "next/link"
import { getPayload } from "payload"

import config from "@payload-config"
import { firstParam, STUDIO_PATHS } from "@/lib/studio/paths"
import { formatDh, formatMoroccanPhone, formatRelativeTime } from "@/lib/studio/format"
import { normalizePhoneLast9 } from "@/lib/studio/repeat-rate"
import { serializeOrderDoc } from "@/lib/studio/serialize-order"
import type { OrdersManagerOrder } from "@/lib/studio/serialize-order"

type SearchParams = Record<string, string | string[] | undefined>

/** Defensive cap, same as the metrics page — comfortably above current order volume. */
const RANGE_FETCH_LIMIT = 5000

type ClientRow = {
  phoneKey: string
  phone: string
  customerName: string
  ordersCount: number
  totalSpent: number
  lastOrderAt: string
  isRecurring: boolean
}

type StatusFilter = "all" | "recurring" | "new"
type SortBy = "recent" | "orders" | "amount"

function sortRows(rows: ClientRow[], sortBy: SortBy): ClientRow[] {
  const sorted = [...rows]
  if (sortBy === "orders") return sorted.sort((a, b) => b.ordersCount - a.ordersCount)
  if (sortBy === "amount") return sorted.sort((a, b) => b.totalSpent - a.totalSpent)
  return sorted.sort((a, b) => (a.lastOrderAt < b.lastOrderAt ? 1 : -1))
}

function buildClientRows(orders: OrdersManagerOrder[]): ClientRow[] {
  // `orders` is sorted -createdAt, so the first order seen for a phone is its most recent.
  const groups = new Map<string, OrdersManagerOrder[]>()
  for (const order of orders) {
    const key = normalizePhoneLast9(order.phone)
    if (!key) continue
    const arr = groups.get(key)
    if (arr) arr.push(order)
    else groups.set(key, [order])
  }

  const rows: ClientRow[] = []
  for (const [phoneKey, group] of groups) {
    const latest = group[0]!
    const totalSpent = group
      .filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + o.grandTotal, 0)
    rows.push({
      phoneKey,
      phone: latest.phone,
      customerName: latest.customerName,
      ordersCount: group.length,
      totalSpent,
      lastOrderAt: latest.createdAt,
      isRecurring: group.length > 1,
    })
  }
  return rows
}

/** Clients page — one row per phone number across all orders, marked new vs. recurring. */
export async function ClientsTab({ searchParams }: { searchParams: SearchParams }) {
  const q = (firstParam(searchParams.q) ?? "").trim().toLowerCase().slice(0, 80)
  const statusParam = firstParam(searchParams.status)
  const status: StatusFilter = statusParam === "recurring" || statusParam === "new" ? statusParam : "all"
  const sortParam = firstParam(searchParams.sort)
  const sortBy: SortBy = sortParam === "orders" || sortParam === "amount" ? sortParam : "recent"

  const payload = await getPayload({ config: await config })
  const res = await payload.find({
    collection: "orders",
    depth: 0,
    limit: RANGE_FETCH_LIMIT,
    sort: "-createdAt",
    overrideAccess: true,
  })
  if (res.hasNextPage) {
    console.warn(`[studio clients] order fetch truncated at ${RANGE_FETCH_LIMIT} docs — figures understated`)
  }

  const orders = res.docs
    .map((d) => serializeOrderDoc(d as Record<string, unknown>))
    .filter((o): o is OrdersManagerOrder => o != null)

  const allRows = buildClientRows(orders)
  const recurringCount = allRows.filter((r) => r.isRecurring).length
  const newCount = allRows.length - recurringCount

  let rows = allRows
  if (status === "recurring") rows = rows.filter((r) => r.isRecurring)
  if (status === "new") rows = rows.filter((r) => !r.isRecurring)
  if (q) {
    rows = rows.filter(
      (r) => r.customerName.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q),
    )
  }
  rows = sortRows(rows, sortBy)

  const chip = (active: boolean) =>
    `inline-flex min-h-9 items-center border px-3 text-sm ${
      active ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white text-stone-700"
    }`
  const statusHref = (next: StatusFilter) => {
    const p = new URLSearchParams()
    if (q) p.set("q", q)
    if (next !== "all") p.set("status", next)
    if (sortBy !== "recent") p.set("sort", sortBy)
    const qs = p.toString()
    return qs ? `${STUDIO_PATHS.clients}?${qs}` : STUDIO_PATHS.clients
  }
  const sortHref = (next: SortBy) => {
    const p = new URLSearchParams()
    if (q) p.set("q", q)
    if (status !== "all") p.set("status", status)
    if (next !== "recent") p.set("sort", next)
    const qs = p.toString()
    return qs ? `${STUDIO_PATHS.clients}?${qs}` : STUDIO_PATHS.clients
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-sm border border-stone-300/90 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Total clients</p>
          <p className="mt-2 text-2xl font-semibold text-stone-900">{allRows.length}</p>
        </div>
        <div className="rounded-sm border border-stone-300/90 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Récurrents</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-800">{recurringCount}</p>
        </div>
        <div className="rounded-sm border border-stone-300/90 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Nouveaux</p>
          <p className="mt-2 text-2xl font-semibold text-stone-900">{newCount}</p>
        </div>
      </div>

      <form action={STUDIO_PATHS.clients} className="flex gap-2">
        {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
        {sortBy !== "recent" ? <input type="hidden" name="sort" value={sortBy} /> : null}
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher un nom ou un numéro…"
          className="min-h-10 flex-1 border border-stone-300 bg-white px-3 text-base outline-none focus:border-stone-900 sm:text-sm"
        />
        <button type="submit" className="min-h-10 border border-stone-400 bg-white px-4 text-sm font-medium">
          OK
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Link href={statusHref("all")} className={chip(status === "all")}>
          Tous
        </Link>
        <Link href={statusHref("recurring")} className={chip(status === "recurring")}>
          Récurrents
        </Link>
        <Link href={statusHref("new")} className={chip(status === "new")}>
          Nouveaux
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-stone-500">Trier par :</span>
        <Link href={sortHref("recent")} className={chip(sortBy === "recent")}>
          Dernière commande
        </Link>
        <Link href={sortHref("orders")} className={chip(sortBy === "orders")}>
          Nb commandes
        </Link>
        <Link href={sortHref("amount")} className={chip(sortBy === "amount")}>
          Montant dépensé
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">Aucun client.</p>
      ) : (
        <ul className="divide-y divide-stone-200 border border-stone-200 bg-white">
          {rows.map((row) => (
            <li key={row.phoneKey} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-stone-900">{row.customerName}</span>
                  <span
                    className={`inline-flex items-center rounded-none px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                      row.isRecurring
                        ? "bg-emerald-100 text-emerald-950 ring-emerald-900/15"
                        : "bg-stone-200 text-stone-900 ring-stone-900/10"
                    }`}
                  >
                    {row.isRecurring ? "Récurrent" : "Nouveau"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-stone-500">
                  {formatMoroccanPhone(row.phone)} · {row.ordersCount} commande{row.ordersCount > 1 ? "s" : ""} ·{" "}
                  {formatDh(row.totalSpent)} livré · dernière commande {formatRelativeTime(row.lastOrderAt)}
                </p>
              </div>
              <Link
                href={`${STUDIO_PATHS.orders}?q=${encodeURIComponent(row.phoneKey)}`}
                className="inline-flex min-h-9 items-center border border-stone-300 bg-white px-3 text-xs font-medium text-stone-700"
              >
                Voir commandes
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
