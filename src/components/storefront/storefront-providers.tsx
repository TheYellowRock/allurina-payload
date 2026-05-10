"use client"

import { CartProvider } from "@/components/storefront/cart/cart-context"
import { CartDrawer } from "@/components/storefront/cart/cart-drawer"
import { CartToaster } from "@/components/storefront/cart/cart-toaster"
import { StickyCartBanner } from "@/components/storefront/cart/sticky-cart-banner"
import type { ReactNode } from "react"

export function StorefrontProviders({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      {children}
      <StickyCartBanner />
      <CartToaster />
      <CartDrawer />
    </CartProvider>
  )
}
