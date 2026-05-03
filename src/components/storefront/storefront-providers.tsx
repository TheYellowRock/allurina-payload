"use client"

import { CartProvider } from "@/components/storefront/cart/cart-context"
import { CartDrawer } from "@/components/storefront/cart/cart-drawer"
import type { ReactNode } from "react"

export function StorefrontProviders({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
    </CartProvider>
  )
}
