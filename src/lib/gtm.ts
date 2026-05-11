"use client"

import { sendGTMEvent } from "@next/third-parties/google"

import type { CartLineItem } from "@/lib/cart/types"

export const GTM_CURRENCY = "MAD" as const

export function gtmTrackAddToCart(item: {
  title: string
  price: number
  quantity: number
}) {
  sendGTMEvent({
    event: "add_to_cart",
    currency: GTM_CURRENCY,
    item_name: item.title,
    price: item.price,
    quantity: item.quantity,
  })
}

export function gtmTrackViewCartFromBanner(payload: {
  itemCount: number
  grandTotal: number
}) {
  sendGTMEvent({
    event: "view_cart",
    currency: GTM_CURRENCY,
    item_count: payload.itemCount,
    value: payload.grandTotal,
  })
}

export function gtmTrackBeginCheckout(payload: {
  grandTotal: number
  items: CartLineItem[]
}) {
  sendGTMEvent({
    event: "begin_checkout",
    currency: GTM_CURRENCY,
    value: payload.grandTotal,
    items: payload.items.map((line) => ({
      item_name: line.title,
      price: line.price,
      quantity: line.quantity,
    })),
  })
}
