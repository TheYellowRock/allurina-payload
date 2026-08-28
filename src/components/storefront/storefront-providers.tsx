"use client"

import type { ReactNode } from "react"

import { CartProvider } from "@/components/storefront/cart/cart-context"
import { CartDrawer } from "@/components/storefront/cart/cart-drawer"
import { CartToaster } from "@/components/storefront/cart/cart-toaster"
import { StickyOfferBar } from "@/components/storefront/cart/sticky-offer-bar"
import { DEFAULT_PROMO_ID, getPromoDefinition } from "@/lib/promotions/registry"

export function StorefrontProviders({
  children,
  activePromoId,
}: {
  children: ReactNode
  /**
   * Just the id, not the full `PromoDefinition` — `resolve`/`cart.statusFor` are
   * functions and can't cross the server→client boundary as props. The registry is pure
   * data/functions with no server-only imports, so it's safe to re-look-up client-side.
   */
  activePromoId: string
}) {
  const promo = getPromoDefinition(activePromoId) ?? getPromoDefinition(DEFAULT_PROMO_ID)!

  return (
    <CartProvider promo={promo}>
      {children}
      <StickyOfferBar />
      <CartToaster />
      <CartDrawer />
    </CartProvider>
  )
}
