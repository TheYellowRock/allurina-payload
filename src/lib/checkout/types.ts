import type { CartLineItem } from "@/lib/cart/types"

export type CheckoutCustomerPayload = {
  customerName: string
  email: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  postalCode: string
  country: string
  notes?: string
}

export type CheckoutRequestPayload = {
  customer: CheckoutCustomerPayload
  items: CartLineItem[]
  paymentMethod: "cod"
}
