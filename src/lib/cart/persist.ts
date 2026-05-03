import { CART_STORAGE_KEY } from "@/lib/cart/constants"
import type { CartLineItem } from "@/lib/cart/types"

function isValidLine(x: unknown): x is CartLineItem {
  if (!x || typeof x !== "object") return false
  const o = x as Record<string, unknown>
  return (
    typeof o.productId === "string" &&
    o.productId.length > 0 &&
    typeof o.slug === "string" &&
    typeof o.title === "string" &&
    typeof o.price === "number" &&
    Number.isFinite(o.price) &&
    o.price >= 0 &&
    typeof o.quantity === "number" &&
    Number.isInteger(o.quantity) &&
    o.quantity >= 1 &&
    (o.imageSrc === null || typeof o.imageSrc === "string")
  )
}

export function parseStoredCart(raw: string | null): CartLineItem[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return []
    return data.filter(isValidLine)
  } catch {
    return []
  }
}

export function readCartFromStorage(): CartLineItem[] {
  if (typeof window === "undefined") return []
  return parseStoredCart(window.localStorage.getItem(CART_STORAGE_KEY))
}

export function writeCartToStorage(items: CartLineItem[]): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
}
