import Link from "next/link"
import { ShoppingBag } from "lucide-react"

import { AddToCartButton } from "@/components/storefront/cart/add-to-cart-button"
import { Badge } from "@/components/ui/badge"
import { Card, CardTitle } from "@/components/ui/card"
import {
  availabilityBadgeClassName,
  formatScarfPrice,
} from "@/lib/storefront-scarf-display"
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
  const featuredEntry = productImages[0]
  const hoverEntry = productImages[1]
  const imageSrc = featuredEntry?.src ?? null
  const imageAlt = featuredEntry?.alt ?? scarf.title
  const hoverSrc = hoverEntry?.src ?? null
  const hoverAlt = hoverEntry?.alt ?? imageAlt

  const href = productPath(scarf.slug)
  const productId = String(scarf.id)

  return (
    <div className={cn("group/card relative", className)}>
      <Link
        href={href}
        className="absolute inset-0 z-0 rounded-none ring-inset focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 focus-visible:outline-none"
        aria-label={`Voir ${scarf.title}`}
      />
      <Card
        className={cn(
          "pointer-events-none flex w-full flex-col gap-0 overflow-hidden p-0 py-0 aspect-3/5",
        )}
      >
        <div className="relative min-h-0 flex-1 basis-0 overflow-hidden bg-muted">
          {imageSrc ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt={imageAlt}
                className={cn(
                  "absolute inset-0 size-full object-cover transition-opacity duration-500 ease-out",
                  hoverSrc && "group-hover/card:opacity-0",
                )}
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              {hoverSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={hoverSrc}
                  alt={hoverAlt}
                  className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500 ease-out group-hover/card:opacity-100"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              ) : null}
            </>
          ) : (
            <div className="flex h-full min-h-40 items-center justify-center text-sm font-light text-muted-foreground">
              Sans visuel
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2.5 px-4 py-4 sm:gap-3 sm:px-5 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="line-clamp-2 font-light leading-snug tracking-wide text-foreground">
              {scarf.title}
            </CardTitle>
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 rounded-none border font-light text-[10px] uppercase tracking-wider",
                availabilityBadgeClassName(scarf.availability.status),
              )}
            >
              {scarf.availability.label}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <p className="text-lg font-light tabular-nums tracking-wide text-foreground">
              {formatScarfPrice(scarf.price)}
            </p>
            <AddToCartButton
              item={{
                productId,
                slug: scarf.slug,
                title: scarf.title,
                price: scarf.price,
                imageSrc,
                quantity: 1,
              }}
              size="sm"
              variant="outline"
              className="pointer-events-auto relative z-10 h-9 gap-2 border-stone-300 bg-transparent px-4 font-light tracking-wide hover:bg-stone-50"
              aria-label={`Ajouter ${scarf.title} au panier`}
            >
              <ShoppingBag className="size-3.5 opacity-70" strokeWidth={1.5} />
              Ajouter
            </AddToCartButton>
          </div>
        </div>
      </Card>
    </div>
  )
}
