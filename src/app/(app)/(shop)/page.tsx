import { PromoBanner } from "@/components/PromoBanner"
import { HomeCatalog } from "@/components/storefront/filterable-catalog"
import { HeroBanner } from "@/components/storefront/hero-banner"
import { ProductRail } from "@/components/storefront/product-rail"
import { ScarfCard } from "@/components/storefront/scarf-card"
import { getBestSellers } from "@/lib/catalog/best-sellers"
import { getColorwayCards } from "@/lib/catalog/colorways"
import { getFilterChips } from "@/lib/catalog/filter-chips.server"
import { getActivePromo } from "@/lib/promotions/active"
import { CHALES_PATH, PULLS_PATH } from "@/lib/routes"

export const dynamic = "force-dynamic"

/**
 * Homepage (Oct 2026 layout):
 *   1. Hero + active promo banner
 *   2. Meilleures ventes — best-selling scarves (last 90 days), carousel → /chales
 *   3. Pulls — one card per colour in stock, carousel → /pulls
 *   4. Tous nos châles — every scarf (best sellers included), sticky filter chips +
 *      infinite scroll
 *
 * The previous sections (Summer/Outlet/Top-sales rails, material tiles, per-material
 * previews, testimonials) were removed from this page; their components still exist
 * (`home-collection-rail`, `home-category-preview-grid`) if a section comes back.
 */
export default async function Home({ searchParams }: { searchParams: Promise<{ filtre?: string }> }) {
  const [bestSellers, pullCards, activePromo, { filtre }] = await Promise.all([
    getBestSellers("chales"),
    getColorwayCards("pulls"),
    getActivePromo(),
    searchParams,
  ])
  // The full list repeats the best sellers on purpose: a visitor scrolling the grid
  // must find every scarf there, whatever the rail above showed.
  const { chips, total } = await getFilterChips("chales")

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#faf9f7] text-stone-900">
      <main>
        <HeroBanner />
        <PromoBanner banner={activePromo.banner} />

        <ProductRail
          id="meilleures-ventes"
          kicker="Châles"
          title="Meilleures ventes"
          viewMoreHref={CHALES_PATH}
          viewMoreLabel="Voir tous les châles"
        >
          {bestSellers.map((scarf, i) => (
            <ScarfCard key={String(scarf.id)} scarf={scarf} cardIndex={i} layout="rail" />
          ))}
        </ProductRail>

        <ProductRail
          id="pulls"
          kicker="Nouveau"
          title="Pulls"
          viewMoreHref={PULLS_PATH}
          viewMoreLabel="Voir tous les pulls"
          className="bg-white"
        >
          {pullCards.map((card) => (
            // cardIndex ≥ 4: below the fold, keep these photos lazy.
            <ScarfCard key={String(card.id)} scarf={card} cardIndex={8} layout="rail" />
          ))}
        </ProductRail>

        <HomeCatalog
          title="Tous nos châles"
          productType="chales"
          excludeIds={[]}
          chips={chips}
          totalCount={total}
          initialFilter={filtre}
        />
      </main>
    </div>
  )
}
