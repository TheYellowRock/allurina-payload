import { cache } from "react"
import { getPayload } from "payload"

import config from "@payload-config"
import { resolveStorefrontAvailability } from "@/lib/availability"
import { productColorPath } from "@/lib/routes"
import { storefrontMediaUrl } from "@/lib/storefront-scarf-display"
import type { StorefrontScarf } from "@/lib/storefront-scarf-types"

import { getProductTypeId } from "./product-types"

/**
 * "One card per colour" for products sold in sizes × colours (pulls): the same pull in
 * Noir and in Beige shows as two cards, each with that colour's photos, linking to the
 * product page with the colour pre-selected. Only colours with stock in at least one size
 * get a card.
 *
 * Returned as `StorefrontScarf` objects (with `cardHref`/`cardSubtitle`) so the existing
 * product card and grids render them unchanged.
 */

function relId(value: unknown): string | null {
  if (typeof value === "number" || (typeof value === "string" && value)) return String(value)
  if (value && typeof value === "object" && "id" in value) return relId((value as { id: unknown }).id)
  return null
}

type ColorInfo = { id: string; slug: string; name: string; order: number }

export const getColorwayCards = cache(async (productTypeSlug?: string): Promise<StorefrontScarf[]> => {
  const payload = await getPayload({ config: await config })
  const typeId = productTypeSlug ? await getProductTypeId(payload, productTypeSlug) : null
  if (productTypeSlug && typeId === null) return []

  const products = await payload.find({
    collection: "scarves",
    where: {
      and: [
        { hasVariants: { equals: true } },
        { stockQuantity: { greater_than: 0 } },
        ...(typeId !== null ? [{ productType: { equals: typeId } }] : []),
      ],
    },
    depth: 2,
    limit: 100,
    pagination: false,
    sort: "-updatedAt",
    overrideAccess: true,
  })
  if (products.docs.length === 0) return []

  const variants = await payload.find({
    collection: "product-variants",
    where: { product: { in: products.docs.map((p) => p.id) } },
    depth: 1,
    limit: 2000,
    pagination: false,
    sort: "createdAt",
    overrideAccess: true,
  })

  const cards: StorefrontScarf[] = []
  for (const raw of products.docs) {
    const product = raw as Record<string, unknown>
    const productId = String(product.id)
    const productPrice = Number(product.price ?? 0)
    const title = String(product.title ?? "")
    const slug = String(product.slug ?? "")

    // Photos per colour, in the order set in the editor.
    const colorPhotos = new Map<string, unknown[]>()
    for (const entry of Array.isArray(product.colorImages) ? (product.colorImages as Record<string, unknown>[]) : []) {
      const colorId = relId(entry.color)
      if (colorId) colorPhotos.set(colorId, Array.isArray(entry.images) ? entry.images : [])
    }

    // Stock and lowest price per colour (in-stock sizes only).
    const byColor = new Map<string, { color: ColorInfo; stock: number; price: number | null }>()
    for (const rawVariant of variants.docs) {
      const v = rawVariant as Record<string, unknown>
      if (relId(v.product) !== productId) continue
      const color = v.color as { id?: unknown; slug?: unknown; name?: unknown } | null
      const colorId = relId(color)
      if (!colorId || !color) continue
      const stock = Number(v.stockQuantity ?? 0)
      const price = typeof v.priceOverride === "number" ? v.priceOverride : productPrice
      const order = colorPhotos.has(colorId) ? [...colorPhotos.keys()].indexOf(colorId) : 1000 + byColor.size
      const entry = byColor.get(colorId) ?? {
        color: { id: colorId, slug: String(color.slug ?? colorId), name: String(color.name ?? ""), order },
        stock: 0,
        price: null,
      }
      entry.stock += stock
      if (stock > 0) entry.price = entry.price === null ? price : Math.min(entry.price, price)
      byColor.set(colorId, entry)
    }

    const colours = [...byColor.values()].filter((c) => c.stock > 0).sort((a, b) => a.color.order - b.color.order)
    for (const { color, stock, price } of colours) {
      // Card photos: that colour's gallery, else the product's main photos.
      const photos = (colorPhotos.get(color.id) ?? []).filter((img) => storefrontMediaUrl(img))
      const featuredImage = photos[0] ?? product.featuredImage
      const galleryImages = photos.length > 0 ? photos.slice(1) : (product.galleryImages ?? [])
      cards.push({
        id: `${productId}-${color.id}`,
        title,
        slug,
        price: price ?? productPrice,
        stockQuantity: stock,
        featuredImage,
        galleryImages,
        categories: product.categories,
        collections: product.collections,
        tags: product.tags,
        availabilityTags: product.availabilityTags,
        availability: resolveStorefrontAvailability({ stockQuantity: stock, availabilityTags: product.availabilityTags }),
        hasVariants: true,
        cardHref: productColorPath(slug, color.slug),
        cardSubtitle: color.name,
      })
    }
  }
  return cards
})
