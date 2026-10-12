import { lineKey, type CartAddPayload, type CartLineItem } from "@/lib/cart/types"

/** Lines are identified by `lineKey` (product + optional variant), not by productId alone. */
export function addOrMergeLine(items: CartLineItem[], incoming: CartAddPayload): CartLineItem[] {
  const qty = Math.max(1, Math.floor(incoming.quantity))
  const key = lineKey(incoming)
  const idx = items.findIndex((i) => lineKey(i) === key)
  if (idx === -1) {
    return [
      ...items,
      {
        productId: incoming.productId,
        ...(incoming.variantId ? { variantId: incoming.variantId } : {}),
        ...(incoming.variantLabel ? { variantLabel: incoming.variantLabel } : {}),
        slug: incoming.slug,
        title: incoming.title,
        price: incoming.price,
        imageSrc: incoming.imageSrc,
        quantity: qty,
      },
    ]
  }
  const next = [...items]
  const cur = next[idx]!
  next[idx] = { ...cur, quantity: cur.quantity + qty }
  return next
}

export function setLineQuantity(items: CartLineItem[], key: string, quantity: number): CartLineItem[] {
  const q = Math.floor(quantity)
  if (q < 1) return items.filter((i) => lineKey(i) !== key)
  return items.map((i) => (lineKey(i) === key ? { ...i, quantity: q } : i))
}

export function removeLine(items: CartLineItem[], key: string): CartLineItem[] {
  return items.filter((i) => lineKey(i) !== key)
}

export function cartItemCount(items: CartLineItem[]): number {
  return items.reduce((acc, i) => acc + i.quantity, 0)
}

export function cartSubtotal(items: CartLineItem[]): number {
  return items.reduce((acc, i) => acc + i.price * i.quantity, 0)
}
