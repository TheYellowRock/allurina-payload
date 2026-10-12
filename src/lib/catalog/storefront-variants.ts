import type { Payload } from "payload"

import { storefrontMediaUrl } from "@/lib/storefront-scarf-display"
import type { StorefrontVariantOptions } from "@/lib/storefront-scarf-types"

function relId(value: unknown): string | null {
  if (typeof value === "number" || (typeof value === "string" && value)) return String(value)
  if (value && typeof value === "object" && "id" in value) return relId((value as { id: unknown }).id)
  return null
}

/**
 * Sizes, colours (with their photos) and per-variant stock/price for one product's page.
 * `product` must be read at depth ≥ 2 so `colorImages[].images` are populated media docs.
 */
export async function loadStorefrontVariantOptions(
  payload: Payload,
  product: Record<string, unknown>,
): Promise<StorefrontVariantOptions> {
  const res = await payload.find({
    collection: "product-variants",
    where: { product: { equals: product.id as number } },
    sort: "createdAt",
    depth: 1,
    limit: 500,
    pagination: false,
    overrideAccess: true,
  })

  const productPrice = Number(product.price ?? 0)
  const title = String(product.title ?? "")
  const sizes = new Map<string, { id: string; label: string; order: number }>()
  const colors = new Map<string, { id: string; name: string; hex: string }>()
  const variants: StorefrontVariantOptions["variants"] = []

  for (const raw of res.docs) {
    const v = raw as Record<string, unknown>
    const size = v.size as { id?: unknown; label?: unknown; sortOrder?: unknown } | null
    const color = v.color as { id?: unknown; name?: unknown; hex?: unknown } | null
    const sizeId = relId(size)
    const colorId = relId(color)
    if (!sizeId || !colorId || !size || !color) continue
    sizes.set(sizeId, { id: sizeId, label: String(size.label ?? ""), order: Number(size.sortOrder ?? 0) })
    colors.set(colorId, { id: colorId, name: String(color.name ?? ""), hex: String(color.hex ?? "#cccccc") })
    variants.push({
      id: String(v.id),
      sizeId,
      colorId,
      stock: Number(v.stockQuantity ?? 0),
      price: typeof v.priceOverride === "number" ? v.priceOverride : productPrice,
    })
  }

  const imagesByColor = new Map<string, { src: string; alt: string }[]>()
  for (const entry of Array.isArray(product.colorImages) ? (product.colorImages as Record<string, unknown>[]) : []) {
    const colorId = relId(entry.color)
    if (!colorId) continue
    const list = (Array.isArray(entry.images) ? entry.images : [])
      .map((img) => storefrontMediaUrl(img))
      .filter((src): src is string => Boolean(src))
      .map((src) => ({ src, alt: `${title} — ${colors.get(colorId)?.name ?? ""}`.trim() }))
    imagesByColor.set(colorId, list)
  }

  return {
    sizes: [...sizes.values()].sort((a, b) => a.order - b.order).map(({ id, label }) => ({ id, label })),
    // Colour order = the order of "Photos par couleur" in the editor, then the rest by creation.
    colors: [...colors.values()]
      .map((c, i) => ({ c, rank: imagesByColor.has(c.id) ? [...imagesByColor.keys()].indexOf(c.id) : 1000 + i }))
      .sort((a, b) => a.rank - b.rank)
      .map(({ c }) => ({ ...c, images: imagesByColor.get(c.id) ?? [] })),
    variants,
  }
}
