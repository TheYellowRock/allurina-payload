"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

/**
 * Lets a page tell the floating WhatsApp button what the customer is looking at, so the
 * pre-filled message names the product. Only product pages set it; everywhere else the
 * button falls back to a generic message.
 */
type WhatsAppContextValue = {
  productTitle: string | null
  setProductTitle: (title: string | null) => void
}

const WhatsAppContext = createContext<WhatsAppContextValue | null>(null)

export function WhatsAppProvider({ children }: { children: ReactNode }) {
  const [productTitle, setProductTitle] = useState<string | null>(null)
  return (
    <WhatsAppContext.Provider value={{ productTitle, setProductTitle }}>
      {children}
    </WhatsAppContext.Provider>
  )
}

export function useWhatsAppContext(): WhatsAppContextValue {
  const ctx = useContext(WhatsAppContext)
  if (!ctx) throw new Error("useWhatsAppContext must be used inside WhatsAppProvider")
  return ctx
}

/** Drop into a product page: sets the product title on mount, clears it on leave. */
export function WhatsAppProductContext({ title }: { title: string }) {
  const { setProductTitle } = useWhatsAppContext()
  useEffect(() => {
    setProductTitle(title)
    return () => setProductTitle(null)
  }, [title, setProductTitle])
  return null
}
