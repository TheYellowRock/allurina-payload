"use server"

import { getPayload } from "payload"

import config from "@payload-config"
import { resolveLines } from "@/lib/catalog/resolve-lines"

export type CartValidationLine = {
  productId: string
  variantId?: string
  quantity: number
  price: number
}

export type CartValidationItem = {
  productId: string
  variantId: string | null
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
 * Re-reads price and stock for every cart line (product, or product + variant) — called
 * on cart/checkout mount so the UI can flag drift before the user submits (see
 * `applyCartValidation` in `@/lib/cart/reconcile` for how the result is folded back).
 */
export async function validateCart(lines: CartValidationLine[]): Promise<CartValidationResult> {
  if (lines.length === 0) {
    return { ok: true, items: [] }
  }

  const payload = await getPayload({ config: await config })
  const resolved = await resolveLines(payload, lines)

  const items: CartValidationItem[] = lines.map((line, i) => {
    const r = resolved[i]!
    if (!r.exists || r.price === null || r.stock === null) {
      return {
        productId: line.productId,
        variantId: r.variantId,
        exists: false,
        title: null,
        currentPrice: null,
        currentStock: null,
        priceChanged: false,
        insufficientStock: false,
      }
    }
    return {
      productId: line.productId,
      variantId: r.variantId,
      exists: true,
      title: r.title,
      currentPrice: r.price,
      currentStock: r.stock,
      priceChanged: r.price !== line.price,
      insufficientStock: r.stock < line.quantity,
    }
  })

  const ok = items.every((item) => item.exists && !item.priceChanged && !item.insufficientStock)
  return { ok, items }
}
