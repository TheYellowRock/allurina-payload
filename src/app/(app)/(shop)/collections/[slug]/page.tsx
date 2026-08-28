import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import {
  CollectionPageIntro,
  CollectionProductGrid,
} from "@/components/storefront/catalog-section"
import { getStorefrontCollectionBySlug } from "@/lib/getStorefrontCollectionBySlug"
import { getScarvesWithAvailability } from "@/lib/getScarvesStorefront"
import { TOUTES_LES_PIECES_PATH } from "@/lib/routes"
import { scarfBelongsToCollection } from "@/lib/scarfFilters"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const collection = await getStorefrontCollectionBySlug(slug)
  if (!collection) {
    return { title: "Collection — AllurinaScarf" }
  }
  return {
    title: `${collection.name} — AllurinaScarf`,
    description:
      collection.description ??
      `Découvrez les pièces de la collection ${collection.name}.`,
  }
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params

  const [collection, { scarves }] = await Promise.all([
    getStorefrontCollectionBySlug(slug),
    getScarvesWithAvailability(),
  ])

  if (!collection) {
    notFound()
  }

  const inCollection = scarves.filter((s) => scarfBelongsToCollection(s, slug))

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#faf9f7] text-stone-900">
      <CollectionPageIntro
        title={collection.name}
        description={collection.description}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Toutes les pièces", href: TOUTES_LES_PIECES_PATH },
          { label: collection.name },
        ]}
      />

      {inCollection.length === 0 ? (
        <div className="mx-auto max-w-6xl px-4 py-16 text-center md:px-6">
          <p className="text-stone-600">
            Aucun produit dans cette collection pour le moment. Associez des châles depuis
            l&apos;admin.
          </p>
          <p className="mt-6 text-sm">
            <Link href={TOUTES_LES_PIECES_PATH} className="underline underline-offset-4">
              Voir toutes les pièces
            </Link>
          </p>
        </div>
      ) : (
        <CollectionProductGrid scarves={inCollection} />
      )}
    </div>
  )
}
