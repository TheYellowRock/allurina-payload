"use client"

import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { useEffect, useState } from "react"

import { AddToCartButton } from "@/components/storefront/cart/add-to-cart-button"
import { ScarfCardGallery } from "@/components/storefront/scarf-card-gallery"
import { Card, CardTitle } from "@/components/ui/card"
import { CATALOG_LIST_PRICE_DH } from "@/lib/cart/pricing"
import { formatScarfPrice, storefrontPrimaryCategoryLine } from "@/lib/storefront-scarf-display"
import type { StorefrontScarf } from "@/lib/storefront-scarf-types"
import { productPath } from "@/lib/routes"
import { storefrontProductImages } from "@/lib/storefrontProductMedia"
import { cn } from "@/lib/utils"

export function ScarfCard({
  scarf,
  className,
  cardIndex,
}: {
  scarf: StorefrontScarf
  className?: string
  /** Grid position (0-based). First row uses `priority` on images to avoid lazy-load / IO issues on iOS. */
  cardIndex?: number
}) {
  const productImages = storefrontProductImages(
    scarf.featuredImage,
    scarf.galleryImages,
    scarf.title,
  )
  const [slideIndex, setSlideIndex] = useState(0)

  useEffect(() => {
    setSlideIndex(0)
  }, [scarf.id])

  const cartImageSrc =
    productImages[slideIndex]?.src ?? productImages[0]?.src ?? null

  const href = productPath(scarf.slug)
  const productId = String(scarf.id)

  const salePrice = scarf.price
  const showListStrike = salePrice < CATALOG_LIST_PRICE_DH - Number.EPSILON

  const categoryLine = storefrontPrimaryCategoryLine(scarf.categories)

  return (
    <div className={cn("group/card relative min-w-0", className)}>
      <Card
        className={cn(
          "flex min-w-0 w-full flex-col gap-0 overflow-hidden p-0 py-0",
        )}
      >
        <div className="relative w-full shrink-0 overflow-hidden bg-stone-100 aspect-4/5 sm:aspect-3/4 lg:aspect-3/5">
          <div className="absolute inset-0 min-h-0 min-w-0 overflow-hidden">
            <ScarfCardGallery
              images={productImages}
              productHref={href}
              productTitle={scarf.title}
              onActiveIndexChange={setSlideIndex}
              priorityFirstSlide={cardIndex !== undefined && cardIndex < 4}
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 px-3.5 pb-2.5 pt-2 sm:px-3.5 sm:pb-3 sm:pt-2.5">
          <Link
            href={href}
            className="flex min-w-0 flex-col gap-1 rounded-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-stone-900"
          >
            <CardTitle className="line-clamp-1 min-w-0 text-sm font-semibold leading-snug tracking-wide text-stone-900 transition-colors group-hover/card:text-stone-950 sm:text-[0.9375rem]">
              {scarf.title}
            </CardTitle>
            {categoryLine ? (
              <span className="line-clamp-1 text-xs font-light text-stone-500">
                {categoryLine}
              </span>
            ) : null}
            <span className="mt-0.5 flex flex-wrap items-baseline gap-2 tabular-nums">
              {showListStrike ? (
                <span className="text-xs font-light text-red-500/90 line-through decoration-red-400 sm:text-sm">
                  {formatScarfPrice(CATALOG_LIST_PRICE_DH)}
                </span>
              ) : null}
              <span
                className={cn(
                  "text-base leading-none tracking-wide sm:text-[1.0625rem]",
                  showListStrike
                    ? "font-semibold text-red-600"
                    : "font-medium text-foreground",
                )}
              >
                {formatScarfPrice(salePrice)}
              </span>
            </span>
          </Link>

          <AddToCartButton
            item={{
              productId,
              slug: scarf.slug,
              title: scarf.title,
              price: scarf.price,
              imageSrc: cartImageSrc,
              quantity: 1,
            }}
            size="sm"
            variant="outline"
            className="relative z-20 h-9 w-full min-w-0 justify-center gap-2 rounded-none border-2 border-stone-900 bg-transparent px-4 text-xs font-medium uppercase tracking-[0.2em] text-stone-900 shadow-none transition-colors hover:bg-stone-900 hover:text-white active:bg-stone-950 active:text-white [&_svg]:text-stone-900 hover:[&_svg]:text-white active:[&_svg]:text-white"
            aria-label={`Ajouter ${scarf.title} au panier`}
          >
            <ShoppingBag className="size-3.5" strokeWidth={1.75} />
            Ajouter
          </AddToCartButton>
        </div>
      </Card>
    </div>
  )
}

export { ScarfCard as ProductCard }
