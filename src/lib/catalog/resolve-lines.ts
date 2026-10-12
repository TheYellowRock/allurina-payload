import type { Payload } from "payload"

import { storefrontMediaUrl } from "@/lib/storefront-scarf-display"

/**
 * Server-side source of truth for cart/order lines: re-reads price, stock, title and
 * variant from the database for every `{ productId, variantId? }` the client sent.
 * Used by both `validateCart` (cart/checkout revalidation) and `POST /api/store/checkout`
 * (order creation), so the two can never disagree on what a line costs or whether it
 * can be sold.
 *
 * Rules:
 * - simple product (scarf): price and stock from the product; a `variantId` is refused.
 * - product with variants (pull): a `variantId` of THAT product is required; price =
 *   the variant's override or the product price; stock = the variant's stock.
 */

export type LineRef = { productId: string; variantId?: string | null }

export type ResolvedLine = {
  productId: string
  variantId: string | null
  /** False when the product/variant doesn't exist or the combination isn't sellable. */
  exists: boolean
  title: string | null
  slug: string | null
  /** e.g. "M/L · Noir" — null for simple products. */
  variantLabel: string | null
  price: number | null
  stock: number | null
  imageSrc: string | null
}

function relId(value: unknown): string | null {
  if (typeof value === "number" || (typeof value === "string" && value)) return String(value)
  if (value && typeof value === "object" && "id" in value) return relId((value as { id: unknown }).id)
  return null
}

function isNumericId(id: string | null | undefined): id is string {
  return typeof id === "string" && /^\d+$/.test(id)
}

/** Photo for a variant line: the first photo of its colour if the product has one, else the main photo. */
function imageFor(product: Record<string, unknown>, colorId: string | null): string | null {
  if (colorId && Array.isArray(product.colorImages)) {
    const entry = (product.colorImages as Record<string, unknown>[]).find((e) => relId(e.color) === colorId)
    const first = Array.isArray(entry?.images) ? entry.images[0] : null
    const url = storefrontMediaUrl(first)
    if (url) return url
  }
  return storefrontMediaUrl(product.featuredImage)
}

export async function resolveLines(payload: Payload, refs: LineRef[]): Promise<ResolvedLine[]> {
  const productIds = [...new Set(refs.map((r) => r.productId).filter(isNumericId))]
  const variantIds = [...new Set(refs.map((r) => r.variantId).filter(isNumericId))]

  const [products, variants] = await Promise.all([
    productIds.length
      ? payload.find({
          collection: "scarves",
          where: { id: { in: productIds } },
          depth: 1,
          limit: productIds.length,
          pagination: false,
          overrideAccess: true,
        })
      : null,
    variantIds.length
      ? payload.find({
          collection: "product-variants",
          where: { id: { in: variantIds } },
          depth: 1,
          limit: variantIds.length,
          pagination: false,
          overrideAccess: true,
        })
      : null,
  ])

  const productById = new Map((products?.docs ?? []).map((d) => [String(d.id), d as Record<string, unknown>]))
  const variantById = new Map((variants?.docs ?? []).map((d) => [String(d.id), d as Record<string, unknown>]))

  return refs.map((ref): ResolvedLine => {
    const variantId = ref.variantId ? String(ref.variantId) : null
    const missing: ResolvedLine = {
      productId: ref.productId,
      variantId,
      exists: false,
      title: null,
      slug: null,
      variantLabel: null,
      price: null,
      stock: null,
      imageSrc: null,
    }
    const product = productById.get(ref.productId)
    if (!product) return missing

    const base = {
      ...missing,
      title: String(product.title ?? ""),
      slug: String(product.slug ?? ""),
    }
    const productPrice = Number(product.price ?? 0)

    if (product.hasVariants !== true) {
      if (variantId) return base // a simple product has no variants
      return {
        ...base,
        exists: true,
        price: productPrice,
        stock: Number(product.stockQuantity ?? 0),
        imageSrc: storefrontMediaUrl(product.featuredImage),
      }
    }

    if (!variantId) return base // a size/colour must be chosen
    const variant = variantById.get(variantId)
    if (!variant || relId(variant.product) !== ref.productId) return base

    const size = variant.size as { label?: unknown } | null
    const color = variant.color as { id?: unknown; name?: unknown } | null
    const override = variant.priceOverride
    return {
      ...base,
      exists: true,
      variantLabel: [size?.label, color?.name].filter(Boolean).map(String).join(" · ") || null,
      price: typeof override === "number" ? override : productPrice,
      stock: Number(variant.stockQuantity ?? 0),
      imageSrc: imageFor(product, relId(color)),
    }
  })
}
