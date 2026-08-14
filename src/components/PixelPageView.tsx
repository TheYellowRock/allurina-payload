"use client"

import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"

import { pageview } from "@/lib/pixel"

export function PixelPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isMounted = useRef(false)

  useEffect(() => {
    // Skip the initial mount — the inline pixel init script already fires PageView.
    // Only fire on subsequent client-side route changes.
    if (!isMounted.current) {
      isMounted.current = true
      return
    }
    const eventId = crypto.randomUUID()
    pageview(eventId)
    void fetch("/api/pixel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName: "PageView", eventData: { eventId } }),
    })
  }, [pathname, searchParams])

  return null
}
