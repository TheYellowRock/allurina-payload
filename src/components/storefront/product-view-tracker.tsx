"use client"

import { useEffect } from "react"

import { readFbc, readFbp } from "@/lib/fb-cookies"
import { fbEvent } from "@/lib/pixel"

export function ProductViewTracker({
  productId,
  price,
}: {
  productId: string
  price: number
}) {
  useEffect(() => {
    const eventId = crypto.randomUUID()
    fbEvent(
      "ViewContent",
      {
        content_ids: [productId],
        content_type: "product",
        value: price,
        currency: "MAD",
      },
      eventId,
    )
    void fetch("/api/pixel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName: "ViewContent",
        eventData: {
          eventId,
          products: [{ id: productId, quantity: 1, item_price: price }],
          value: price,
          fbp: readFbp() ?? undefined,
          fbc: readFbc() ?? undefined,
        },
      }),
    })
  }, [productId, price])

  return null
}
