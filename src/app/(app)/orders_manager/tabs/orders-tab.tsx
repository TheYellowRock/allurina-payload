import { getPayload } from "payload"
import type { Where } from "payload"

import config from "@payload-config"
import { isOrderStatus, urgentCutoffIso } from "@/lib/orders-manager/order-status"
import { serializeOrderDoc } from "@/lib/orders-manager/serialize-order"
import type { OrdersManagerOrder } from "@/lib/orders-manager/serialize-order"
import { firstParam, ORDERS_TAB_PAGE_SIZE } from "@/lib/orders-manager/tabs"

import { OrdersList } from "./orders-list"

const PAGE_SIZE = ORDERS_TAB_PAGE_SIZE

type SearchParams = Record<string, string | string[] | undefined>

function serializeDocs(docs: unknown[]): OrdersManagerOrder[] {
  return docs
    .map((d) => serializeOrderDoc(d as Record<string, unknown>))
    .filter((o): o is OrdersManagerOrder => o != null)
}

export async function OrdersTab({ searchParams }: { searchParams: SearchParams }) {
  const resolvedConfig = await config
  const payload = await getPayload({ config: resolvedConfig })

  const q = (firstParam(searchParams.q) ?? "").trim()
  const rawStatus = firstParam(searchParams.status)
  const status = rawStatus && isOrderStatus(rawStatus) ? rawStatus : "all"
  const rawPage = Number(firstParam(searchParams.page))
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1

  const isDefaultView = q === "" && status === "all" && page === 1

  if (isDefaultView) {
    const cutoffIso = urgentCutoffIso()

    const urgentWhere: Where = {
      status: { equals: "pending" },
      createdAt: { less_than: cutoffIso },
    }
    // "Everything else": not a stale-pending order — either not pending at all, or
    // pending but still within the grace window (not yet urgent).
    const restWhere: Where = {
      or: [{ status: { not_equals: "pending" } }, { createdAt: { greater_than_equal: cutoffIso } }],
    }

    const [urgentRes, restRes] = await Promise.all([
      payload.find({
        collection: "orders",
        where: urgentWhere,
        depth: 0,
        limit: 100,
        sort: "createdAt", // oldest-waiting first — the longest-neglected order is the most urgent
        overrideAccess: true,
      }),
      payload.find({
        collection: "orders",
        where: restWhere,
        depth: 0,
        page,
        limit: PAGE_SIZE,
        sort: "-createdAt",
        overrideAccess: true,
      }),
    ])

    return (
      <OrdersList
        key={`${q}|${status}|${page}`}
        urgentOrders={serializeDocs(urgentRes.docs)}
        orders={serializeDocs(restRes.docs)}
        page={restRes.page ?? page}
        hasNextPage={Boolean(restRes.hasNextPage)}
        hasPrevPage={Boolean(restRes.hasPrevPage)}
        totalDocs={restRes.totalDocs}
        q={q}
        status={status}
      />
    )
  }

  const conditions: Where[] = []
  if (status !== "all") {
    conditions.push({ status: { equals: status } })
  }
  if (q !== "") {
    conditions.push({
      or: [
        { orderReference: { like: q } },
        { customerName: { like: q } },
        { phone: { like: q } },
        { city: { like: q } },
        { email: { like: q } },
      ],
    })
  }
  const where: Where = conditions.length > 0 ? { and: conditions } : {}

  const res = await payload.find({
    collection: "orders",
    where,
    depth: 0,
    page,
    limit: PAGE_SIZE,
    sort: "-createdAt",
    overrideAccess: true,
  })

  return (
    <OrdersList
      key={`${q}|${status}|${page}`}
      urgentOrders={[]}
      orders={serializeDocs(res.docs)}
      page={res.page ?? page}
      hasNextPage={Boolean(res.hasNextPage)}
      hasPrevPage={Boolean(res.hasPrevPage)}
      totalDocs={res.totalDocs}
      q={q}
      status={status}
    />
  )
}
