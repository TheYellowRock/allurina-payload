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

  if (!PIXEL_ID || !ACCESS_TOKEN) return

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
  }

  await fetch(
    `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  )
}
