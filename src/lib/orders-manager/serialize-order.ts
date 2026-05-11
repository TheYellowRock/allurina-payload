import type { OrderStatus } from "@/lib/orders-manager/order-status"
import { isOrderStatus } from "@/lib/orders-manager/order-status"
import type { CartLineItem } from "@/lib/cart/types"

export type OrdersManagerOrder = {
  id: string
  orderReference: string
  customerName: string
  email: string
  phone: string
  addressLine1: string
  addressLine2: string | null
  city: string
  postalCode: string
  country: string
  notes: string | null
  paymentMethod: string
  status: OrderStatus
  items: CartLineItem[]
  subtotal: number
  volumeDiscount: number
  deliveryFee: number
  grandTotal: number
  createdAt: string
}

function parseItems(raw: unknown): CartLineItem[] {
  if (!Array.isArray(raw)) return []
  const out: CartLineItem[] = []
  for (const x of raw) {
    if (!x || typeof x !== "object") continue
    const o = x as Record<string, unknown>
    if (
      typeof o.productId === "string" &&
      typeof o.slug === "string" &&
      typeof o.title === "string" &&
      typeof o.price === "number" &&
      typeof o.quantity === "number" &&
      (o.imageSrc === null || typeof o.imageSrc === "string")
    ) {
      out.push({
        productId: o.productId,
        slug: o.slug,
        title: o.title,
        price: o.price,
        quantity: o.quantity,
        imageSrc: o.imageSrc as string | null,
      })
    }
  }
  return out
}

export function serializeOrderDoc(doc: Record<string, unknown>): OrdersManagerOrder | null {
  const id = doc.id
  if (id === undefined || id === null) return null
  const rawStatus = doc.status
  const status: OrderStatus =
    typeof rawStatus === "string" && isOrderStatus(rawStatus) ? rawStatus : "pending"

  return {
    id: String(id),
    orderReference: String(doc.orderReference ?? ""),
    customerName: String(doc.customerName ?? ""),
    email: String(doc.email ?? ""),
    phone: String(doc.phone ?? ""),
    addressLine1: String(doc.addressLine1 ?? ""),
    addressLine2: doc.addressLine2 != null ? String(doc.addressLine2) : null,
    city: String(doc.city ?? ""),
    postalCode: String(doc.postalCode ?? ""),
    country: String(doc.country ?? ""),
    notes: doc.notes != null ? String(doc.notes) : null,
    paymentMethod: String(doc.paymentMethod ?? ""),
    status,
    items: parseItems(doc.items),
    subtotal: Number(doc.subtotal ?? 0),
    volumeDiscount: Number(doc.volumeDiscount ?? 0),
    deliveryFee: Number(doc.deliveryFee ?? 0),
    grandTotal: Number(doc.grandTotal ?? 0),
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : String(doc.createdAt ?? ""),
  }
}
