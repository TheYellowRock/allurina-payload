import type { Metadata } from "next"

import {
  CollectionPageIntro,
  CollectionProductGrid,
} from "@/components/storefront/catalog-section"
import { getAllScarvesWithAvailability } from "@/lib/getScarvesStorefront"
import { NOUVEAUTES_PATH } from "@/lib/routes"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Toutes les pièces — AllurinaScarf",
  description: "Catalogue complet des châles et foulards.",
}

export default async function ToutesLesPiecesPage() {
  const { scarves } = await getAllScarvesWithAvailability()

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#faf9f7] text-stone-900">
      <CollectionPageIntro
        title="Toutes les pièces"
        description="L’intégralité du catalogue — filtrez par collection ou par matière depuis le menu."
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Toutes les pièces" },
        ]}
      />

      {scarves.length === 0 ? (
        <div className="mx-auto max-w-6xl px-4 py-16 text-center md:px-6">
          <p className="text-stone-600">Aucun produit pour le moment.</p>
        </div>
      ) : (
        <CollectionProductGrid
          scarves={scarves}
          footerLinks={[
            { href: NOUVEAUTES_PATH, label: "Nouveautés" },
            { href: "/#matieres", label: "Par matière" },
          ]}
        />
      )}
    </div>
  )
}
