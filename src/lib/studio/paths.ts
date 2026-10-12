/** Every page of the staff Studio (formerly `/orders_manager`). One place to change a URL. */
export const STUDIO_PATHS = {
  root: "/studio",
  orders: "/studio/commandes",
  catalog: "/studio/catalogue",
  newProduct: "/studio/catalogue/nouveau",
  metrics: "/studio/metriques",
  performance: "/studio/performances",
  promotions: "/studio/promotions",
} as const

export function studioProductPath(id: number | string): string {
  return `${STUDIO_PATHS.catalog}/${id}`
}

export function studioDuplicatePath(id: number | string): string {
  return `${STUDIO_PATHS.newProduct}?from=${id}`
}

export type SearchParams = Record<string, string | string[] | undefined>

/** A single search param value, taking the first entry if Next.js parsed a repeated key as an array. */
export function firstParam(raw: string | string[] | undefined): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw
}

/** Shared between the orders page (server fetch) and orders-list.tsx (pagination UI) so they can't drift. */
export const ORDERS_PAGE_SIZE = 20

/** `basePath` + the current query string — the target used for the post-login redirect. */
export function withSearchParams(basePath: string, searchParams: SearchParams): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue
    for (const v of Array.isArray(value) ? value : [value]) params.append(key, v)
  }
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}
