import { headers } from "next/headers"

import { hashUserData } from "@/lib/meta-hash"

export type CapiProduct = { id: string; quantity: number; item_price: number }

export type CapiEventData = {
  value?: number
  products?: CapiProduct[]
  eventId?: string
  /**
   * Full absolute URL of the page that triggered the event. Must be passed by the
   * caller (client-side `window.location.href`) — the server has no reliable way to
   * reconstruct this itself, and a `Referer` header can be stripped or wrong.
   */
  eventSourceUrl?: string
  phone?: string
  firstName?: string
  lastName?: string
  city?: string
  externalId?: string
  /** Sent unhashed — Meta requires `_fbp`/`_fbc` raw, unlike the rest of `user_data`. */
  fbp?: string
  fbc?: string
}

const CURRENCY = "MAD"

// RFC 1918 / loopback / link-local ranges — never a genuine public client IP. If the
// extracted address falls in one of these, something upstream (a dev proxy, a
// misconfigured hop, a non-edge request) is leaking an internal address rather than the
// real visitor's. Sending it to Meta is exactly how "IP shared across many users" shows
// up in Events Manager — confirmed by reproducing it locally: Next's dev server injects
// `x-forwarded-for: ::ffff:127.0.0.1` when nothing upstream sets a real one.
const NON_PUBLIC_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^::ffff:127\./,
  /^fc00:/i,
  /^fe80:/i,
]

function isPublicIp(ip: string): boolean {
  return ip.length > 0 && !NON_PUBLIC_IP_PATTERNS.some((pattern) => pattern.test(ip))
}

/** Resolves the current request's client IP + user agent from the ambient request context. */
async function resolveRequestContext(): Promise<{ ip?: string; userAgent?: string }> {
  const headerList = await headers()
  const forwardedFor = headerList.get("x-forwarded-for")
  const realIp = headerList.get("x-real-ip")
  const candidate = forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || ""

  return {
    ip: candidate && isPublicIp(candidate) ? candidate : undefined,
    userAgent: headerList.get("user-agent") ?? undefined,
  }
}

function isValidMonetaryValue(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
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

  const { ip, userAgent } = await resolveRequestContext()
  if (!ip) {
    console.warn(
      `[conversions-api] ${eventName}: no usable public client IP (missing or private/loopback) — omitting client_ip_address`,
    )
  }
  if (!userAgent) {
    console.warn(`[conversions-api] ${eventName}: no user-agent header — omitting client_user_agent`)
  }
  if (!eventData.eventSourceUrl) {
    console.warn(`[conversions-api] ${eventName}: no event_source_url provided by caller`)
  }

  // Guard: never forward a malformed monetary value. `value` must be present-and-valid
  // for the events that carry one (AddToCart, InitiateCheckout, Purchase — harmless to
  // apply to any other event that happens to include a value too).
  let value: number | undefined
  if (eventData.value !== undefined) {
    const rounded = Math.round(eventData.value * 100) / 100
    if (!isValidMonetaryValue(rounded) || CURRENCY !== "MAD") {
      console.error(`[conversions-api] ${eventName}: refusing to send — malformed value/currency`, {
        value: eventData.value,
        currency: CURRENCY,
      })
      return
    }
    value = rounded
  }

  const TEST_EVENT_CODE = process.env.FACEBOOK_TEST_EVENT_CODE

  // No `email` here on purpose — COD business, email is rarely collected and isn't sent
  // to CAPI. (Browser-side Advanced Matching, a separate mechanism, still uses it.)
  const hashed = hashUserData({
    phone: eventData.phone,
    firstName: eventData.firstName,
    lastName: eventData.lastName,
    city: eventData.city,
    externalId: eventData.externalId,
  })

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_id: eventData.eventId ?? crypto.randomUUID(),
        ...(eventData.eventSourceUrl ? { event_source_url: eventData.eventSourceUrl } : {}),
        custom_data: {
          currency: CURRENCY,
          value,
          contents: eventData.products,
          content_type: "product",
        },
        user_data: {
          client_ip_address: ip,
          client_user_agent: userAgent,
          fbp: eventData.fbp,
          fbc: eventData.fbc,
          ...hashed,
        },
      },
    ],
    ...(TEST_EVENT_CODE && process.env.NODE_ENV !== "production"
      ? { test_event_code: TEST_EVENT_CODE }
      : {}),
  }

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
