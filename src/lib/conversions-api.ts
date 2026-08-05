export type CapiProduct = { sku: string; quantity: number }

export type CapiEventData = {
  value?: number
  products?: CapiProduct[]
  ip?: string
  userAgent?: string
  eventId?: string
}

export async function sendServerEvent(
  eventName: string,
  eventData: CapiEventData = {},
): Promise<void> {
  const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
  const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN

  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn("[conversions-api] Missing PIXEL_ID or ACCESS_TOKEN — CAPI event not sent")
    return
  }

  const TEST_EVENT_CODE = process.env.FACEBOOK_TEST_EVENT_CODE

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_id: eventData.eventId ?? crypto.randomUUID(),
        custom_data: {
          currency: "MAD",
          value: eventData.value,
          contents: eventData.products,
          content_type: "product",
        },
        user_data: {
          client_ip_address: eventData.ip,
          client_user_agent: eventData.userAgent,
        },
      },
    ],
    ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
  }

  console.log("[conversions-api] outgoing payload", JSON.stringify(payload))

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  )

  const body = await res.json()
  if (!res.ok || body?.error) {
    console.error("[conversions-api] Meta CAPI rejected event", eventName, body)
  }
}
