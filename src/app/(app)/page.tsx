import Link from "next/link"

import { HeroBanner } from "@/components/storefront/hero-banner"
import { LaunchPromoBanner } from "@/components/storefront/launch-promo-banner"
import { HomeCategoryPreviewGrid } from "@/components/storefront/home-category-preview-grid"
import { HomeCollectionRail } from "@/components/storefront/home-collection-rail"
import { Button } from "@/components/ui/button"
import {
  HOME_OUTLET_COLLECTION_SLUG,
  HOME_SUMMER_COLLECTION_SLUG,
  HOME_TOP_SALES_TAG_FALLBACK_ID,
  HOME_TOP_SALES_TAG_SLUG,
} from "@/lib/homeLandingRails"
import { getStorefrontCategories } from "@/lib/getStorefrontCategories"
import {
  getScarvesByCatalogTagSlug,
  getScarvesByCollectionSlug,
  getScarvesWithAvailability,
} from "@/lib/getScarvesStorefront"
import {
  NOUVEAUTES_PATH,
  TOUTES_LES_PIECES_PATH,
  chalesCategoryPath,
  collectionPath,
} from "@/lib/routes"
import type { StorefrontScarf } from "@/lib/storefront-scarf-types"

export const dynamic = "force-dynamic"

function scarfInCategory(scarf: StorefrontScarf, categorySlug: string): boolean {
  const cats = scarf.categories
  if (!cats || !Array.isArray(cats)) return false
  for (const item of cats) {
    if (!item || typeof item !== "object") continue
    const slug = (item as { slug?: string }).slug
    if (slug === categorySlug) return true
  }
  return false
}

export default async function Home() {
  const [
    { scarves },
    categories,
    summerRail,
    outletRail,
    topSalesRail,
  ] = await Promise.all([
    getScarvesWithAvailability(),
    getStorefrontCategories(),
    getScarvesByCollectionSlug(HOME_SUMMER_COLLECTION_SLUG),
    getScarvesByCollectionSlug(HOME_OUTLET_COLLECTION_SLUG),
    getScarvesByCatalogTagSlug(HOME_TOP_SALES_TAG_SLUG, HOME_TOP_SALES_TAG_FALLBACK_ID),
  ])

  const chalesPreviewTitle: Record<string, string> = {
    "chales-en-crepe": "Crêpe",
    "chales-en-mousseline": "Mousseline",
    "chales-en-fil-de-lin": "Fil de lin",
    "chales-en-satin": "Satin",
  }

  function categoryPreviewRow(slug: string) {
    const cat = categories.find((c) => c.slug === slug)
    const title =
      chalesPreviewTitle[slug] ??
      cat?.name.replace(/^Châles\s+en\s+/i, "").replace(/^Châles\s+/i, "") ??
      slug
    return {
      title,
      exploreHref: chalesCategoryPath(slug),
      scarves: scarves.filter((s) => scarfInCategory(s, slug)),
    }
  }

  const crepeRow = categoryPreviewRow("chales-en-crepe")
  const mousselineRow = categoryPreviewRow("chales-en-mousseline")
  const linRow = categoryPreviewRow("chales-en-fil-de-lin")
  const satinRow = categoryPreviewRow("chales-en-satin")

  const testimonials = [
    {
      quote:
        "Qualité au rendez-vous, les couleurs sont encore plus belles en vrai. Envoi soigné jusqu’à Tanger.",
      author: "Soraya",
      city: "Tanger",
    },
    {
      quote:
        "Tombé fluide, tissu agréable — mon hijab du quotidien. Service client réactif depuis Marrakech.",
      author: "Khadija",
      city: "Marrakech",
    },
    {
      quote:
        "Colis bien emballé, délais corrects vers l’est. Je recommande AllurinaScarf à Oujda et ailleurs.",
      author: "Nadia",
      city: "Oujda",
    },
  ]

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#faf9f7] text-stone-900">
      <main>
        <HeroBanner />
        <LaunchPromoBanner />

        <HomeCollectionRail
          id="selection-summer"
          title="Summer !"
          scarves={summerRail.scarves}
          headerActionHref={collectionPath(HOME_SUMMER_COLLECTION_SLUG)}
          headerActionLabel="Voir la collection"
          exploreHref={collectionPath(HOME_SUMMER_COLLECTION_SLUG)}
        />

        <HomeCollectionRail
          id="selection-outlet"
          title="Outlet"
          scarves={outletRail.scarves}
          headerActionHref={collectionPath(HOME_OUTLET_COLLECTION_SLUG)}
          headerActionLabel="Voir la collection"
          exploreHref={collectionPath(HOME_OUTLET_COLLECTION_SLUG)}
          className="bg-white"
        />

        <HomeCollectionRail
          id="top-sales"
          title="Top sales"
          scarves={topSalesRail.scarves}
          headerActionHref={TOUTES_LES_PIECES_PATH}
          headerActionLabel="Toutes les pièces"
          exploreHref={TOUTES_LES_PIECES_PATH}
        />

        {/* Quatre matières — grille 2×2, puis Les essentiels */}
        <section className="border-b border-stone-200/80">
          <div className="grid grid-cols-2 gap-px bg-stone-200/80">
            <Link
              href={chalesCategoryPath("chales-en-fil-de-lin")}
              className="group relative flex min-h-44 flex-col justify-end bg-[#f2efe8] px-4 py-8 text-stone-900 transition-colors hover:bg-[#ebe6dc] sm:min-h-52 sm:px-6 sm:py-10 md:min-h-60 md:px-8"
            >
              <p className="text-[10px] font-semibold tracking-[0.2em] text-stone-500 uppercase transition-colors group-hover:text-stone-700 sm:text-xs sm:tracking-[0.25em]">
                Naturel
              </p>
              <h2 className="mt-1.5 text-2xl font-semibold sm:mt-2 sm:text-3xl md:text-4xl">
                Fil de lin
              </h2>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-stone-600 sm:text-sm">
                Respirant et élégant, pour un tombé structuré du quotidien aux tenues soignées.
              </p>
              <span className="mt-4 inline-flex text-[10px] font-semibold tracking-widest text-stone-800 uppercase underline underline-offset-4 sm:mt-6 sm:text-xs">
                Shopper
              </span>
            </Link>
            <Link
              href={chalesCategoryPath("chales-en-crepe")}
              className="group relative flex min-h-44 flex-col justify-end bg-amber-50 px-4 py-8 text-stone-900 transition-colors hover:bg-amber-100/90 sm:min-h-52 sm:px-6 sm:py-10 md:min-h-60 md:px-8"
            >
              <p className="text-[10px] font-semibold tracking-[0.2em] text-stone-600 uppercase sm:text-xs sm:tracking-[0.25em]">
                Texture
              </p>
              <h2 className="mt-1.5 text-2xl font-semibold sm:mt-2 sm:text-3xl md:text-4xl">Crêpe</h2>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-stone-700 sm:text-sm">
                Tombé fluide, finitions nettes, idéal du quotidien aux occasions.
              </p>
              <span className="mt-4 inline-flex text-[10px] font-semibold tracking-widest uppercase underline underline-offset-4 sm:mt-6 sm:text-xs">
                Shopper
              </span>
            </Link>
            <Link
              href={chalesCategoryPath("chales-en-mousseline")}
              className="group relative flex min-h-44 flex-col justify-end bg-stone-800 px-4 py-8 text-white transition-colors hover:bg-stone-900 sm:min-h-52 sm:px-6 sm:py-10 md:min-h-60 md:px-8"
            >
              <p className="text-[10px] font-semibold tracking-[0.2em] text-stone-400 uppercase transition-colors group-hover:text-stone-200 sm:text-xs sm:tracking-[0.25em]">
                Douceur
              </p>
              <h2 className="mt-1.5 text-2xl font-semibold sm:mt-2 sm:text-3xl md:text-4xl">
                Mousseline
              </h2>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-stone-300 sm:text-sm">
                Légère, aérienne, idéale pour le quotidien comme les occasions.
              </p>
              <span className="mt-4 inline-flex text-[10px] font-semibold tracking-widest uppercase underline underline-offset-4 sm:mt-6 sm:text-xs">
                Shopper
              </span>
            </Link>
            <Link
              href={chalesCategoryPath("chales-en-satin")}
              className="group relative flex min-h-44 flex-col justify-end bg-[#f4eef2] px-4 py-8 text-stone-900 transition-colors hover:bg-[#ede4ea] sm:min-h-52 sm:px-6 sm:py-10 md:min-h-60 md:px-8"
            >
              <p className="text-[10px] font-semibold tracking-[0.2em] text-stone-500 uppercase transition-colors group-hover:text-stone-700 sm:text-xs sm:tracking-[0.25em]">
                Brillance
              </p>
              <h2 className="mt-1.5 text-2xl font-semibold sm:mt-2 sm:text-3xl md:text-4xl">Satin</h2>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-stone-600 sm:text-sm">
                Finition lumineuse et tombé soyeux, parfait du bureau aux occasions.
              </p>
              <span className="mt-4 inline-flex text-[10px] font-semibold tracking-widest text-stone-800 uppercase underline underline-offset-4 sm:mt-6 sm:text-xs">
                Shopper
              </span>
            </Link>
          </div>

          <div className="border-t border-stone-200/80 bg-white py-16 md:py-20">
            <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
              <h2 className="text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
                Les essentiels
              </h2>
              <p className="mt-5 text-pretty text-base leading-relaxed text-stone-600 md:text-lg">
                Une palette contemporaine — fil de lin, crêpe, mousseline et satin — pour composer des
                tenues modestes avec personnalité. Matières nobles, tombés étudiés, détails discrets.
              </p>
              <Button variant="link" className="mt-6 text-stone-800" asChild>
                <Link href={NOUVEAUTES_PATH}>Voir les nouveautés</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Matières — aperçu 4 pièces */}
        <div id="matieres" className="scroll-mt-28">
          <HomeCategoryPreviewGrid
            title={linRow.title}
            exploreHref={linRow.exploreHref}
            scarves={linRow.scarves}
            variant="cream"
          />
          <HomeCategoryPreviewGrid
            title={crepeRow.title}
            exploreHref={crepeRow.exploreHref}
            scarves={crepeRow.scarves}
            variant="white"
          />
          <HomeCategoryPreviewGrid
            title={mousselineRow.title}
            exploreHref={mousselineRow.exploreHref}
            scarves={mousselineRow.scarves}
            variant="cream"
          />
          <HomeCategoryPreviewGrid
            title={satinRow.title}
            exploreHref={satinRow.exploreHref}
            scarves={satinRow.scarves}
            variant="white"
          />
        </div>

        {/* Testimonials — Culture-style social proof strip */}
        <section className="border-t border-stone-200/80 bg-stone-900 py-16 text-stone-100 md:py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <p className="text-center text-xs font-semibold tracking-[0.3em] text-stone-400 uppercase">
              Elles parlent de nous
            </p>
            <h2
              className={`mt-3 text-center text-3xl font-semibold text-white md:text-4xl`}
            >
              La confiance avant tout
            </h2>
            <ul className="mt-12 grid gap-8 md:grid-cols-3">
              {testimonials.map((t) => (
                <li
                  key={`${t.author}-${t.city}`}
                  className="border border-stone-700/80 bg-stone-800/50 p-6"
                >
                  <p className="text-sm leading-relaxed text-stone-200">&ldquo;{t.quote}&rdquo;</p>
                  <p className="mt-4 text-xs font-semibold tracking-wide text-stone-400 uppercase">
                    {t.author} — {t.city}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}
