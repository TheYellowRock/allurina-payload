"use client"

import { X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

import { HeaderIconButton } from "@/components/storefront/site-header/header-icon-button"
import { NAV } from "@/components/storefront/site-header/nav-styles"
import type { StorefrontCategory } from "@/lib/getStorefrontCategories"
import type { StorefrontCollection } from "@/lib/getStorefrontCollections"
import { chalesTypeLabel } from "@/lib/navLabels"
import { NOUVEAUTES_PATH, TOUTES_LES_PIECES_PATH, chalesCategoryPath } from "@/lib/routes"
import { cn } from "@/lib/utils"

export function MobileNavDrawer({
  collections,
  chalesCategories,
  navFontClassName,
  open,
  onClose,
}: {
  collections: StorefrontCollection[]
  chalesCategories: StorefrontCategory[]
  navFontClassName: string
  open: boolean
  onClose: () => void
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true)
    })
  }, [])

  if (!open || !mounted) return null

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[100] bg-stone-900/40 backdrop-blur-[2px] lg:hidden"
        aria-label="Fermer le menu"
        onClick={onClose}
      />
      <div
        id="mobile-nav-drawer"
        className={cn(
          navFontClassName,
          "fixed inset-y-0 right-0 z-[101] flex w-[min(100%,20rem)] flex-col bg-white shadow-2xl lg:hidden",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xs font-semibold tracking-[0.2em] text-stone-500 uppercase">
            Menu
          </span>
          <HeaderIconButton onClick={onClose} aria-label="Fermer le menu">
            <X className="size-5" strokeWidth={1.75} />
          </HeaderIconButton>
        </div>

        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-4 pb-6 pt-1">
          <Link
            href={NOUVEAUTES_PATH}
            className={cn(NAV.drawerLink, "-mx-1 px-1 font-semibold text-stone-900")}
            onClick={onClose}
          >
            Nouveautés
          </Link>

          <section>
            <p className={NAV.sectionLabel}>Collections</p>
            <div className="flex flex-col gap-0.5">
              <Link
                href={TOUTES_LES_PIECES_PATH}
                className={cn(NAV.drawerLink, "text-stone-700")}
                onClick={onClose}
              >
                Tous les articles
              </Link>
              {collections.map((c) => (
                <Link
                  key={c.slug}
                  href={`/collections/${c.slug}`}
                  className={cn(NAV.drawerLink, "text-stone-700")}
                  onClick={onClose}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </section>

          <section>
            <p className={NAV.sectionLabel}>Châles</p>
            <div className="flex flex-col gap-0.5">
              {chalesCategories.map((c) => (
                <Link
                  key={`drawer-chales-${c.slug}`}
                  href={chalesCategoryPath(c.slug)}
                  className={cn(NAV.drawerLink, "text-stone-700")}
                  onClick={onClose}
                >
                  {chalesTypeLabel(c.name)}
                </Link>
              ))}
            </div>
          </section>
        </nav>
      </div>
    </>,
    document.body,
  )
}
