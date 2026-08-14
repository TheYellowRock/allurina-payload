"use server"

import { getPayload } from "payload"

import config from "@payload-config"

export type CartValidationLine = {
  productId: string
  quantity: number
  price: number
}

export type CartValidationItem = {
  productId: string
  exists: boolean
  title: string | null
  currentPrice: number | null
  currentStock: number | null
  priceChanged: boolean
  insufficientStock: boolean
}

export type CartValidationResult = {
  ok: boolean
  items: CartValidationItem[]
}

/**
 * Re-reads price and stock for every cart line from `scarves` — called on cart/checkout
 * mount so the UI can flag drift before the user submits (see `applyCartValidation` in
 * `@/lib/cart/reconcile` for how the result is folded back into the cart).
 */
export async function validateCart(lines: CartValidationLine[]): Promise<CartValidationResult> {
  if (lines.length === 0) {
    return { ok: true, items: [] }
  }

  const resolvedConfig = await config
  const payload = await getPayload({ config: resolvedConfig })

  const productIds = [...new Set(lines.map((line) => line.productId))]
  const res = await payload.find({
    collection: "scarves",
    where: { id: { in: productIds } },
    depth: 0,
    limit: productIds.length,
    overrideAccess: true,
  })
  const scarfById = new Map(res.docs.map((doc) => [String(doc.id), doc]))

  const items: CartValidationItem[] = lines.map((line) => {
    const scarf = scarfById.get(line.productId)
    if (!scarf) {
      return {
        productId: line.productId,
        exists: false,
        title: null,
        currentPrice: null,
        currentStock: null,
        priceChanged: false,
        insufficientStock: false,
      }
    }
    const currentPrice = Number(scarf.price)
    const currentStock = Number(scarf.stockQuantity ?? 0)
    return {
      productId: line.productId,
      exists: true,
      title: String(scarf.title),
      currentPrice,
      currentStock,
      priceChanged: currentPrice !== line.price,
      insufficientStock: currentStock < line.quantity,
    }
  })

  const ok = items.every((item) => item.exists && !item.priceChanged && !item.insufficientStock)
  return { ok, items }
}
