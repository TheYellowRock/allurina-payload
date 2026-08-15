import type { AdvancedMatchingData } from "@/lib/meta-advanced-matching"

export const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID

declare global {
  interface Window {
    fbq: {
      (action: "init", pixelId: string, advancedMatching?: Record<string, unknown>): void
      (action: string, event: string, data?: Record<string, unknown>, extra?: { eventID?: string }): void
    }
  }
}

/**
 * Re-initializes the Pixel with (manual) browser-side Advanced Matching data, once it's
 * known — e.g. right before firing `Purchase`, using the checkout form's own data. This
 * only calls `fbq('init', ...)`, never `fbq('track', 'PageView', ...)`, so it can't
 * duplicate the PageView the base snippet already fired on load: the two are separate,
 * explicit calls in Meta's own bootstrap snippet (`MetaPixelScript.tsx`), and `init`
 * doesn't implicitly track anything on its own.
 */
export const initAdvancedMatching = (data: AdvancedMatchingData) => {
  if (typeof window !== "undefined" && window.fbq && PIXEL_ID) {
    window.fbq("init", PIXEL_ID, data)
  }
}

export const pageview = (eventId?: string) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "PageView", undefined, eventId ? { eventID: eventId } : undefined)
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
