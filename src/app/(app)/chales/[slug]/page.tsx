import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  CollectionPageIntro,
  CollectionProductGrid,
} from "@/components/storefront/catalog-section"
import { getScarvesByCategorySlug } from "@/lib/getScarvesStorefront"
import { getStorefrontCategories } from "@/lib/getStorefrontCategories"
import { CHALES_NAV_SLUGS, isChalesNavSlug } from "@/lib/navChales"
import { NOUVEAUTES_PATH, TOUTES_LES_PIECES_PATH } from "@/lib/routes"

export const dynamic = "force-dynamic"

export function generateStaticParams() {
  return CHALES_NAV_SLUGS.map((slug) => ({ slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (!isChalesNavSlug(slug)) {
    return { title: "Châles — Allurina" }
  }
  const categories = await getStorefrontCategories()
  const cat = categories.find((c) => c.slug === slug)
  return {
    title: cat ? `${cat.name} — Allurina` : "Châles — Allurina",
    description: cat?.description ?? undefined,
  }
}

export default async function ChalesCategoryPage({ params }: Props) {
  const { slug } = await params
  if (!isChalesNavSlug(slug)) {
    notFound()
  }

  const [categories, { scarves }] = await Promise.all([
    getStorefrontCategories(),
    getScarvesByCategorySlug(slug),
  ])

  const cat = categories.find((c) => c.slug === slug)
  if (!cat) {
    notFound()
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#faf9f7] text-stone-900">
      <CollectionPageIntro
        title={cat.name}
        description={cat.description}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Châles", href: "/#matieres" },
          { label: cat.name },
        ]}
      />

      {scarves.length === 0 ? (
        <div className="mx-auto max-w-6xl px-4 py-16 text-center md:px-6">
          <p className="text-stone-600">Aucun produit dans cette matière pour le moment.</p>
        </div>
      ) : (
        <CollectionProductGrid
          scarves={scarves}
          footerLinks={[
            { href: TOUTES_LES_PIECES_PATH, label: "Toutes les pièces" },
            { href: NOUVEAUTES_PATH, label: "Nouveautés" },
          ]}
        />
      )}
    </div>
  )
}
