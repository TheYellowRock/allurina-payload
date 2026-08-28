export const ORDERS_MANAGER_TABS = ["orders", "metrics", "products", "promotions"] as const
export type OrdersManagerTab = (typeof ORDERS_MANAGER_TABS)[number]

export function resolveOrdersManagerTab(raw: string | string[] | undefined): OrdersManagerTab {
  const v = Array.isArray(raw) ? raw[0] : raw
  return (ORDERS_MANAGER_TABS as readonly string[]).includes(v ?? "") ? (v as OrdersManagerTab) : "orders"
}

/** A single search param value, taking the first entry if Next.js parsed a repeated key as an array. */
export function firstParam(raw: string | string[] | undefined): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw
}

/** Shared between orders-tab.tsx (server fetch) and orders-list.tsx (pagination UI) so they can't drift. */
export const ORDERS_TAB_PAGE_SIZE = 20

/** Reconstructs `/orders_manager?...` from an awaited `searchParams` object — the target used for the post-login redirect. */
export function buildOrdersManagerPath(searchParams: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, v)
    } else {
      params.append(key, value)
    }
  }
  const qs = params.toString()
  return qs ? `/orders_manager?${qs}` : "/orders_manager"
}
