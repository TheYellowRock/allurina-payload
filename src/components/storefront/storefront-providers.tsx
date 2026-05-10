"use client"

import { CartProvider } from "@/components/storefront/cart/cart-context"
import { CartDrawer } from "@/components/storefront/cart/cart-drawer"
import { StickyCartBanner } from "@/components/storefront/cart/sticky-cart-banner"
import type { ReactNode } from "react"
import { Toaster } from "sonner"

export function StorefrontProviders({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      {children}
      <StickyCartBanner />
      <Toaster position="top-center" richColors closeButton />
      <CartDrawer />
    </CartProvider>
  )
}
