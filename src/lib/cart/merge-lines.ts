import type { CartAddPayload, CartLineItem } from "@/lib/cart/types"

export function addOrMergeLine(
  items: CartLineItem[],
  incoming: CartAddPayload,
): CartLineItem[] {
  const qty = Math.max(1, Math.floor(incoming.quantity))
  const idx = items.findIndex((i) => i.productId === incoming.productId)
  if (idx === -1) {
    return [
      ...items,
      {
        productId: incoming.productId,
        slug: incoming.slug,
        title: incoming.title,
        price: incoming.price,
        imageSrc: incoming.imageSrc,
        quantity: qty,
      },
    ]
  }
  const next = [...items]
  const cur = next[idx]
  next[idx] = { ...cur, quantity: cur.quantity + qty }
  return next
}

export function setLineQuantity(
  items: CartLineItem[],
  productId: string,
  quantity: number,
): CartLineItem[] {
  const q = Math.floor(quantity)
  if (q < 1) return items.filter((i) => i.productId !== productId)
  return items.map((i) => (i.productId === productId ? { ...i, quantity: q } : i))
}

export function removeLine(items: CartLineItem[], productId: string): CartLineItem[] {
  return items.filter((i) => i.productId !== productId)
}

export function cartItemCount(items: CartLineItem[]): number {
  return items.reduce((acc, i) => acc + i.quantity, 0)
}

export function cartSubtotal(items: CartLineItem[]): number {
  return items.reduce((acc, i) => acc + i.price * i.quantity, 0)
}
