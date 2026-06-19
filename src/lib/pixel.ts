export const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID

declare global {
  interface Window {
    fbq: (action: string, event: string, data?: Record<string, unknown>, extra?: { eventID?: string }) => void
  }
}

export const pageview = () => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "PageView")
  }
}

export const fbEvent = (
  name: string,
  options: Record<string, unknown> = {},
  eventId?: string,
) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", name, options, eventId ? { eventID: eventId } : undefined)
  }
}
