import type { Metadata } from "next"

import {
  CollectionPageIntro,
  CollectionProductGrid,
} from "@/components/storefront/catalog-section"
import { getNouveautesScarves } from "@/lib/getScarvesStorefront"
import { TOUTES_LES_PIECES_PATH } from "@/lib/routes"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Nouveautés — Allurina",
  description: "Châles et foulards ajoutés au catalogue au cours des 30 derniers jours.",
}

export default async function NouveautesPage() {
  const { scarves } = await getNouveautesScarves()

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#faf9f7] text-stone-900">
      <CollectionPageIntro
        title="Nouveautés"
        description="Pièces ajoutées au catalogue au cours des 30 derniers jours."
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Nouveautés" },
        ]}
      />

      {scarves.length === 0 ? (
        <div className="mx-auto max-w-6xl px-4 py-16 text-center md:px-6">
          <p className="text-stone-600">
            Aucune nouveauté sur cette période. Consultez l&apos;ensemble du catalogue.
          </p>
        </div>
      ) : (
        <CollectionProductGrid
          scarves={scarves}
          footerLinks={[
            { href: TOUTES_LES_PIECES_PATH, label: "Toutes les pièces" },
            { href: "/#matieres", label: "Par matière" },
          ]}
        />
      )}
    </div>
  )
}
