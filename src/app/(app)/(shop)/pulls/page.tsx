import type { Metadata } from "next"

import { CollectionPageIntro, CollectionProductGrid } from "@/components/storefront/catalog-section"
import { getColorwayCards } from "@/lib/catalog/colorways"
import { CHALES_PATH, NOUVEAUTES_PATH } from "@/lib/routes"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Pulls — AllurinaScarf",
  description: "Nos pulls, du S/M au XL/XXL, en plusieurs couleurs.",
}

/** Every pull, one card per colour in stock — the "Voir plus" target of the homepage pulls rail. */
export default async function PullsPage() {
  const cards = await getColorwayCards("pulls")
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#faf9f7] text-stone-900">
      <CollectionPageIntro
        title="Pulls"
        description="Du S/M au XL/XXL — choisissez votre couleur, puis votre taille sur la fiche."
        breadcrumbs={[{ label: "Accueil", href: "/" }, { label: "Pulls" }]}
      />
      {cards.length === 0 ? (
        <div className="mx-auto max-w-6xl px-4 py-16 text-center md:px-6">
          <p className="text-stone-600">Aucun pull disponible pour le moment.</p>
        </div>
      ) : (
        <CollectionProductGrid
          scarves={cards}
          footerLinks={[
            { href: CHALES_PATH, label: "Châles" },
            { href: NOUVEAUTES_PATH, label: "Nouveautés" },
          ]}
        />
      )}
    </div>
  )
}
