"use client"

import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { useEffect, useState } from "react"

import { AddToCartButton } from "@/components/storefront/cart/add-to-cart-button"
import { ScarfCardGallery } from "@/components/storefront/scarf-card-gallery"
import { Card, CardTitle } from "@/components/ui/card"
import { formatScarfPrice } from "@/lib/storefront-scarf-display"
import type { StorefrontScarf } from "@/lib/storefront-scarf-types"
import { productPath } from "@/lib/routes"
import { storefrontProductImages } from "@/lib/storefrontProductMedia"
import { cn } from "@/lib/utils"

export function ScarfCard({
  scarf,
  className,
}: {
  scarf: StorefrontScarf
  className?: string
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

  /** Catalogue reference for card promo line (strikethrough when sale is lower). */
  const listPriceDh = 80
  const salePrice = scarf.price
  const showListStrike = salePrice < listPriceDh

  return (
    <div className={cn("group/card relative min-w-0", className)}>
      <Card
        className={cn(
          "flex min-w-0 w-full flex-col gap-0 overflow-hidden p-0 py-0 aspect-3/5",
        )}
      >
        <ScarfCardGallery
          images={productImages}
          productHref={href}
          productTitle={scarf.title}
          onActiveIndexChange={setSlideIndex}
        />

        <div className="flex shrink-0 flex-col gap-2 px-3 pb-2.5 pt-2 sm:px-3.5 sm:pb-3 sm:pt-2.5">
          <Link
            href={href}
            className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-2.5 gap-y-0.5 rounded-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-stone-900"
          >
            <CardTitle className="min-w-0 max-w-[55%] flex-1 truncate text-sm font-semibold leading-snug tracking-wide text-stone-900 transition-colors group-hover/card:text-stone-950 sm:max-w-none sm:flex-none sm:text-[0.9375rem]">
              {scarf.title}
            </CardTitle>
            <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
              {showListStrike ? (
                <span className="text-xs font-light text-red-500/90 line-through decoration-red-400 sm:text-sm">
                  {formatScarfPrice(listPriceDh)}
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
