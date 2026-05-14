import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ProductDescription } from "./product-description"
import { ProductGallery } from "./product-gallery"
import { ProductPurchasePanel } from "@/components/storefront/cart/product-purchase-panel"
import { Badge } from "@/components/ui/badge"
import { getStorefrontScarfBySlug } from "@/lib/getStorefrontScarfBySlug"
import { NOUVEAUTES_PATH, TOUTES_LES_PIECES_PATH } from "@/lib/routes"
import {
  availabilityBadgeClassName,
  formatScarfPrice,
} from "@/lib/storefront-scarf-display"
import { storefrontProductImages } from "@/lib/storefrontProductMedia"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const scarf = await getStorefrontScarfBySlug(slug)
  if (!scarf) return { title: "Produit — AllurinaScarf" }
  return {
    title: `${scarf.title} — AllurinaScarf`,
    description: `Châle ${scarf.title}. ${formatScarfPrice(scarf.price)}.`,
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const scarf = await getStorefrontScarfBySlug(slug)
  if (!scarf) notFound()

  const images = storefrontProductImages(
    scarf.featuredImage,
    scarf.galleryImages,
    scarf.title,
  )

  return (
    <div className="min-h-full flex-1 bg-white text-stone-900">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <nav className="text-sm font-light text-stone-600">
          <Link href="/" className="hover:text-stone-900">
            Accueil
          </Link>
          <span className="mx-2 text-stone-400">/</span>
          <Link href={TOUTES_LES_PIECES_PATH} className="hover:text-stone-900">
            Boutique
          </Link>
          <span className="mx-2 text-stone-400">/</span>
          <span className="text-stone-900">{scarf.title}</span>
        </nav>

        <div className="mt-8 grid gap-10 md:mt-10 md:grid-cols-2 md:gap-12 lg:gap-16">
          <div>
            <ProductGallery images={images} productTitle={scarf.title} />
          </div>

          <div className="flex flex-col md:sticky md:top-28 md:self-start">
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="outline"
                className={cn(
                  "rounded-none border px-2.5 py-0.5 text-[10px] font-light uppercase tracking-widest",
                  availabilityBadgeClassName(scarf.availability.status),
                )}
              >
                {scarf.availability.label}
              </Badge>
            </div>

            <h1 className="mt-4 text-balance text-3xl font-light tracking-tight text-stone-900 md:text-4xl">
              {scarf.title}
            </h1>

            <p className="mt-5 text-2xl font-light tabular-nums tracking-wide text-stone-900">
              {formatScarfPrice(scarf.price)}
            </p>

            <ProductPurchasePanel
              product={{
                productId: String(scarf.id),
                slug: scarf.slug,
                title: scarf.title,
                price: scarf.price,
                imageSrc: images[0]?.src ?? null,
              }}
            />

            <div className="mt-10 border-t border-stone-200 pt-10">
              <h2 className="text-xs font-light uppercase tracking-[0.25em] text-stone-500">
                Description
              </h2>
              <ProductDescription data={scarf.description} className="mt-4" />
            </div>

            <p className="mt-10 text-sm font-light text-stone-500">
              <Link href={NOUVEAUTES_PATH} className="underline underline-offset-4 hover:text-stone-800">
                Continuer les achats
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
