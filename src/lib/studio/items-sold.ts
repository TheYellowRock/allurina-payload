import type { OrdersManagerOrder } from "./serialize-order"

/**
 * Units sold over a set of orders, by product type:
 * - scarves (`chales`) are grouped by the price actually paid (80 DH, 85 DH…): each scarf
 *   is unique, so the useful question is "how many at which price point";
 * - every other type (pulls…) is grouped by product.
 *
 * Two counts per row: `sold` = units in non-cancelled orders (pending → delivered),
 * `delivered` = units in delivered orders only.
 */

/** What the catalog knows about a product referenced by an order line. */
export type ProductTypeInfo = { typeSlug: string; typeName: string; title: string }

export type ItemsSoldRow = { key: string; label: string; sold: number; delivered: number }

export type ItemsSoldGroup = {
  typeSlug: string
  typeName: string
  rows: ItemsSoldRow[]
  sold: number
  delivered: number
}

export type ItemsSoldBreakdown = { groups: ItemsSoldGroup[]; sold: number; delivered: number }

/** Scarves: grouped by price. Also the fallback for lines whose product no longer exists — the catalog was scarves only before pulls. */
export const SCARF_TYPE_SLUG = "chales"
const SCARF_TYPE_NAME = "Châles"

export function itemsSoldBreakdown(
  orders: OrdersManagerOrder[],
  products: Map<string, ProductTypeInfo>,
): ItemsSoldBreakdown {
  const groups = new Map<string, ItemsSoldGroup & { byKey: Map<string, ItemsSoldRow> }>()

  for (const order of orders) {
    if (order.status === "cancelled") continue
    const isDelivered = order.status === "delivered"

    for (const line of order.items) {
      const info = products.get(line.productId)
      const typeSlug = info?.typeSlug ?? SCARF_TYPE_SLUG
      const typeName = info?.typeName ?? SCARF_TYPE_NAME

      let group = groups.get(typeSlug)
      if (!group) {
        group = { typeSlug, typeName, rows: [], sold: 0, delivered: 0, byKey: new Map() }
        groups.set(typeSlug, group)
      }

      const byPrice = typeSlug === SCARF_TYPE_SLUG
      const key = byPrice ? `price:${line.price}` : `product:${line.productId}`
      let row = group.byKey.get(key)
      if (!row) {
        row = {
          key,
          label: byPrice ? `${line.price} DH` : (info?.title ?? line.title),
          sold: 0,
          delivered: 0,
        }
        group.byKey.set(key, row)
      }

      row.sold += line.quantity
      group.sold += line.quantity
      if (isDelivered) {
        row.delivered += line.quantity
        group.delivered += line.quantity
      }
    }
  }

  const out: ItemsSoldGroup[] = [...groups.values()].map(({ byKey, ...group }) => {
    const rows = [...byKey.values()]
    if (group.typeSlug === SCARF_TYPE_SLUG) {
      rows.sort((a, b) => Number(a.key.slice(6)) - Number(b.key.slice(6)))
    } else {
      rows.sort((a, b) => b.sold - a.sold || a.label.localeCompare(b.label, "fr"))
    }
    return { ...group, rows }
  })
  // Scarves first, then the other types by volume.
  out.sort((a, b) =>
    a.typeSlug === SCARF_TYPE_SLUG ? -1 : b.typeSlug === SCARF_TYPE_SLUG ? 1 : b.sold - a.sold,
  )

  return {
    groups: out,
    sold: out.reduce((s, g) => s + g.sold, 0),
    delivered: out.reduce((s, g) => s + g.delivered, 0),
  }
}
