export const ORDERS_MANAGER_TABS = ["orders", "metrics", "products"] as const
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
