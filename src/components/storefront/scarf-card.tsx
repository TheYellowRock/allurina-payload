"use client"

import Link from "next/link"
import { Plus, ShoppingBag } from "lucide-react"
import { useState } from "react"

import { AddToCartButton } from "@/components/storefront/cart/add-to-cart-button"
import { ScarfCardGallery } from "@/components/storefront/scarf-card-gallery"
import { ScarfPrice } from "@/components/storefront/scarf-price"
import { getReferencePrice, PROMO_LABEL } from "@/lib/pricing/reference-price"
import type { StorefrontScarf } from "@/lib/storefront-scarf-types"
import { productPath } from "@/lib/routes"
import { storefrontProductImages } from "@/lib/storefrontProductMedia"
import { cn } from "@/lib/utils"

/** Below this, the card says "Plus que N" — scarcity is the only stock signal worth showing. */
const LOW_STOCK_THRESHOLD = 2

/**
 * How the card is laid out:
 * - `grid`    — regular tile in a 2-column (mobile) / 4-column (desktop) grid.
 * - `feature` — the full-width tile that breaks the grid rhythm every 5th product on
 *               phones (taller photo, larger type); a regular tile on desktop.
 * - `rail`    — a slide of the homepage carousels (~80% of the screen on phones).
 */
export type ProductCardLayout = "grid" | "feature" | "rail"

const IMAGE_SIZES: Record<ProductCardLayout, string> = {
  grid: "(max-width: 1024px) 50vw, 25vw",
  feature: "(max-width: 1024px) 100vw, 25vw",
  rail: "(max-width: 768px) 80vw, 25vw",
}

/** Small editorial tag on the photo (top-left). Only for information that changes the decision. */
function CardTag({ children, tone = "light" }: { children: string; tone?: "light" | "promo" | "muted" }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute top-2.5 left-2.5 z-20 px-2 py-[3px] text-[9px] font-semibold tracking-[0.16em] uppercase sm:text-[10px]",
        tone === "promo" && "bg-[#e0102a] text-white",
        tone === "light" && "bg-white/95 text-stone-900",
        tone === "muted" && "bg-stone-900/70 text-white",
      )}
    >
      {children}
    </span>
  )
}

/**
 * Product card, photo-first (Zara-style): the picture fills the card, the text underneath
 * is reduced to name + price, and the only extras are a quiet tag when it matters
 * (promo, last pieces, sold out) and a round bag button on the photo. Colourful scarves
 * need room — every element that isn't the scarf competes with it.
 */
export function ScarfCard({
  scarf,
  className,
  cardIndex,
  layout = "grid",
}: {
  scarf: StorefrontScarf
  className?: string
  /** Position in its list (0-based). The first few eagerly load their photo (LCP on phones). */
  cardIndex?: number
  layout?: ProductCardLayout
}) {
  const productImages = storefrontProductImages(scarf.featuredImage, scarf.galleryImages, scarf.title)
  const [slideIndex, setSlideIndex] = useState(0)
  const cartImageSrc = productImages[slideIndex]?.src ?? productImages[0]?.src ?? null

  const href = scarf.cardHref ?? productPath(scarf.slug)
  const isOutOfStock = scarf.availability.status === "out_of_stock"
  const isDiscounted = getReferencePrice(scarf.price) !== null
  const lowStock = !isOutOfStock && scarf.stockQuantity > 0 && scarf.stockQuantity <= LOW_STOCK_THRESHOLD
  const isFeature = layout === "feature"

  const tag = isOutOfStock ? (
    <CardTag tone="muted">Épuisé</CardTag>
  ) : isDiscounted ? (
    <CardTag tone="promo">{PROMO_LABEL}</CardTag>
  ) : lowStock ? (
    <CardTag>{`Plus que ${scarf.stockQuantity}`}</CardTag>
  ) : null

  const quickButtonClass =
    "absolute right-2.5 bottom-2.5 z-20 flex size-10 items-center justify-center rounded-full bg-white/95 text-stone-900 shadow-[0_2px_10px_rgba(0,0,0,0.12)] transition-transform hover:scale-105 active:scale-95"

  return (
    <div className={cn("group/card relative min-w-0", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden bg-[#efece6]",
          isFeature ? "aspect-4/5 lg:aspect-3/4" : "aspect-3/4",
          isOutOfStock && "opacity-60",
        )}
      >
        {tag}
        <div className="absolute inset-0">
          <ScarfCardGallery
            images={productImages}
            productHref={href}
            productTitle={scarf.title}
            onActiveIndexChange={setSlideIndex}
            priorityFirstSlide={cardIndex !== undefined && cardIndex < 2}
            sizes={IMAGE_SIZES[layout]}
          />
        </div>

        {isOutOfStock ? null : scarf.hasVariants ? (
          // Sizes/colours are chosen on the product page.
          <Link href={href} className={quickButtonClass} aria-label={`Choisir la taille — ${scarf.title}`}>
            <Plus className="size-[18px]" strokeWidth={1.75} />
          </Link>
        ) : (
          <AddToCartButton
            item={{
              productId: String(scarf.id),
              slug: scarf.slug,
              title: scarf.title,
              price: scarf.price,
              imageSrc: cartImageSrc,
              quantity: 1,
            }}
            size="icon"
            variant="ghost"
            className={cn(quickButtonClass, "rounded-full border-0 hover:bg-white")}
            aria-label={`Ajouter ${scarf.title} au panier`}
          >
            <ShoppingBag className="size-[18px]" strokeWidth={1.6} />
          </AddToCartButton>
        )}
      </div>

      <Link
        href={href}
        className={cn(
          "block min-w-0 px-0.5 outline-none focus-visible:ring-2 focus-visible:ring-stone-900",
          isFeature ? "mt-3" : "mt-2.5",
        )}
      >
        <h3
          className={cn(
            "line-clamp-1 font-normal tracking-[0.08em] text-stone-900 uppercase",
            isFeature ? "text-[13px] sm:text-sm" : "text-[11px] sm:text-xs",
          )}
        >
          {scarf.title}
        </h3>
        {scarf.cardSubtitle ? (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-stone-500 sm:text-xs">{scarf.cardSubtitle}</p>
        ) : null}
        <p className="mt-1">
          <ScarfPrice
            price={scarf.price}
            size="sm"
            plainClassName={cn("font-normal text-stone-700", isFeature ? "text-sm" : "text-[12px] sm:text-[13px]")}
          />
        </p>
      </Link>
    </div>
  )
}

export { ScarfCard as ProductCard }
