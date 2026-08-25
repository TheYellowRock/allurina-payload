export type ScarfRef = { id: string; title: string; slug: string }

/** Scarves with zero units across every order line passed in (any status, any date range). */
export function neverSoldProducts(scarves: ScarfRef[], lines: { productId: string }[]): ScarfRef[] {
  const soldIds = new Set(lines.map((l) => l.productId))
  return scarves.filter((s) => !soldIds.has(s.id))
}
