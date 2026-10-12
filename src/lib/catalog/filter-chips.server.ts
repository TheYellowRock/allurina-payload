import { cache } from "react"
import { getPayload } from "payload"

import config from "@payload-config"
import { chalesTypeLabel } from "@/lib/navLabels"
import { CHALES_NAV_SLUGS } from "@/lib/navChales"

import { productMatchesChip, type FilterChip } from "./filter-chips"
import { getProductTypeId } from "./product-types"

/**
 * Chip definitions, in display order. Pattern chips first (what the eye sorts by when
 * everything is colourful), then materials. Materials come from the nav categories so a
 * new material added there shows up here too.
 */
const PATTERN_CHIPS: Omit<FilterChip, "count">[] = [
  { key: "unis", label: "Unis", tags: ["solid"], categories: ["chales-unis"] },
  { key: "motifs", label: "À motifs", tags: ["pattern"], categories: ["chales-a-motifs"] },
]

/** Short material label for a chip: "Châles en fil de lin" → "Lin". */
function materialChipLabel(name: string): string {
  const label = chalesTypeLabel(name)
  return label.replace(/^Fil De /i, "")
}

function materialKey(slug: string): string {
  return slug.replace(/^chales-en-/, "").replace(/^fil-de-/, "")
}

/**
 * Chips for a product type (+ total in-stock count), each with its in-stock count; chips with no product are left
 * out so a tap never lands on an empty grid. Per-request cached.
 *
 * `excludeIds`: products shown elsewhere on the page (homepage best sellers) — counts
 * match what the grid below will actually list.
 */
export const getFilterChips = cache(
  async (productTypeSlug: string, excludeKey = ""): Promise<{ chips: FilterChip[]; total: number }> => {
    const payload = await getPayload({ config: await config })
    const typeId = await getProductTypeId(payload, productTypeSlug)
    if (typeId === null) return { chips: [], total: 0 }
    const excludeIds = excludeKey ? excludeKey.split(",") : []

    const [products, categories] = await Promise.all([
      payload.find({
        collection: "scarves",
        where: {
          and: [
            { stockQuantity: { greater_than: 0 } },
            { productType: { equals: typeId } },
            ...(excludeIds.length ? [{ id: { not_in: excludeIds } }] : []),
          ],
        },
        select: { tags: true, categories: true },
        depth: 1,
        limit: 1000,
        pagination: false,
        overrideAccess: true,
      }),
      payload.find({
        collection: "categories",
        where: { slug: { in: [...CHALES_NAV_SLUGS] } },
        depth: 0,
        limit: 20,
        overrideAccess: true,
      }),
    ])

    const materialChips: Omit<FilterChip, "count">[] = CHALES_NAV_SLUGS.flatMap((slug) => {
      const cat = categories.docs.find((c) => (c as { slug?: string }).slug === slug) as
        | { slug: string; name?: string; title?: string }
        | undefined
      if (!cat) return []
      const name = String(cat.name ?? cat.title ?? slug)
      return [{ key: materialKey(slug), label: materialChipLabel(name), tags: [], categories: [slug] }]
    })

    const docs = products.docs as { tags?: unknown; categories?: unknown }[]
    const chips = [...PATTERN_CHIPS, ...materialChips]
      .map((chip) => {
        const full = { ...chip, count: 0 }
        full.count = docs.filter((d) => productMatchesChip({ tags: d.tags, categories: d.categories }, full)).length
        return full
      })
      .filter((chip) => chip.count > 0)
    return { chips, total: docs.length }
  },
)
