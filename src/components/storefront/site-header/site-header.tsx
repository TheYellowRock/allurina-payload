"use client"

import { Menu } from "lucide-react"
import { useCallback, useState } from "react"

import { CartTrigger } from "@/components/storefront/cart/cart-trigger"
import { BrandLogoLink } from "@/components/storefront/brand-logo-link"
import { DesktopNav } from "@/components/storefront/site-header/desktop-nav"
import { HeaderIconButton } from "@/components/storefront/site-header/header-icon-button"
import { navSans } from "@/components/storefront/site-header/nav-font"
import { MobileNavDrawer } from "@/components/storefront/site-header/mobile-nav-drawer"
import { useLockScrollAndEscape } from "@/components/storefront/site-header/use-nav-lock"
import { orderChalesNavCategories } from "@/lib/navChales"
import type { StorefrontCategory } from "@/lib/getStorefrontCategories"
import type { StorefrontCollection } from "@/lib/getStorefrontCollections"
import { cn } from "@/lib/utils"

export function SiteHeader({
  collections,
  categories,
}: {
  collections: StorefrontCollection[]
  categories: StorefrontCategory[]
}) {
  const merch = collections ?? []
  const chales = categories ?? []
  const chalesNav = orderChalesNavCategories(chales)
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeMobile = useCallback(() => setMobileOpen(false), [])
  const openMobile = useCallback(() => setMobileOpen(true), [])

  useLockScrollAndEscape(mobileOpen, closeMobile)

  const bar = navSans.className

  return (
    <>
      <div
        className={cn(
          navSans.className,
          "bg-stone-900 py-2.5 text-center text-[11px] font-medium tracking-[0.14em] text-stone-100 uppercase sm:tracking-[0.18em]",
        )}
      >
        <p className="mx-auto max-w-2xl px-3 leading-relaxed">
          Toutes les pièces à 65 DH — Livraison gratuite dès 5 pièces au Maroc
        </p>
      </div>

      <header
        className={cn(
          bar,
          "sticky top-0 z-50 border-b border-stone-200/90 bg-white/95 backdrop-blur-md",
        )}
      >
        <div className="mx-auto flex max-w-6xl min-w-0 items-center gap-2 px-3 py-2.5 sm:px-4 md:px-6 md:py-3">
          <div className="min-w-0 max-w-[calc(100%-5.75rem)] shrink md:max-w-none">
            <BrandLogoLink variant="header" />
          </div>

          <DesktopNav collections={merch} chalesCategories={chalesNav} />

          <div className="ml-auto flex items-center gap-0.5">
            <HeaderIconButton
              className="lg:hidden"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
              aria-label="Ouvrir le menu"
              onClick={openMobile}
            >
              <Menu className="size-6" strokeWidth={1.75} />
            </HeaderIconButton>
            <CartTrigger />
          </div>
        </div>
      </header>

      <MobileNavDrawer
        collections={merch}
        chalesCategories={chalesNav}
        navFontClassName={navSans.className}
        open={mobileOpen}
        onClose={closeMobile}
      />
    </>
  )
}
