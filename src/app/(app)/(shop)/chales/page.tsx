import type { Metadata } from "next"

import { CollectionPageIntro } from "@/components/storefront/catalog-section"
import { FilterableProductGrid } from "@/components/storefront/filterable-catalog"
import { getProductsOfType } from "@/lib/catalog/best-sellers"
import { getFilterChips } from "@/lib/catalog/filter-chips.server"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Châles — AllurinaScarf",
  description: "Tous nos châles : fil de lin, crêpe, mousseline, satin.",
}

/** Every scarf in stock — the "Voir plus" target of the homepage best-sellers rail. */
export default async function ChalesPage({ searchParams }: { searchParams: Promise<{ filtre?: string }> }) {
  const [scarves, { chips }, { filtre }] = await Promise.all([
    getProductsOfType("chales"),
    getFilterChips("chales"),
    searchParams,
  ])
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#faf9f7] text-stone-900">
      <CollectionPageIntro
        title="Châles"
        description="Fil de lin, crêpe, mousseline et satin — toutes nos pièces disponibles."
        breadcrumbs={[{ label: "Accueil", href: "/" }, { label: "Châles" }]}
      />
      {scarves.length === 0 ? (
        <div className="mx-auto max-w-6xl px-4 py-16 text-center md:px-6">
          <p className="text-stone-600">Aucun châle disponible pour le moment.</p>
        </div>
      ) : (
        <FilterableProductGrid scarves={scarves} chips={chips} initialFilter={filtre} />
      )}
    </div>
  )
}
