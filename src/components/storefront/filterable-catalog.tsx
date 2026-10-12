"use client"

import { useRef } from "react"

import { AllScarvesGrid } from "@/components/AllScarvesGrid"
import { CatalogFilterBar, useChipSelection } from "@/components/storefront/catalog-filter-bar"
import { ProductGrid } from "@/components/storefront/product-grid"
import { chipQueryParams, productMatchesChip, type FilterChip } from "@/lib/catalog/filter-chips"
import type { StorefrontScarf } from "@/lib/storefront-scarf-types"

/**
 * Homepage "Tous nos châles": title, sticky chips, infinite grid. Each chip remounts the
 * grid (fresh paging from the API with that filter).
 */
export function HomeCatalog({
  title,
  productType,
  excludeIds,
  chips,
  totalCount,
  initialFilter,
}: {
  title: string
  productType: string
  excludeIds: string[]
  chips: FilterChip[]
  totalCount?: number
  initialFilter?: string
}) {
  const { activeKey, activeChip, setActiveKey } = useChipSelection(chips, initialFilter)
  const anchorRef = useRef<HTMLDivElement>(null)

  return (
    <section id="catalogue" aria-label={title} className="scroll-mt-16 bg-[#faf9f7] pt-12 pb-16 md:pt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-5 md:px-6">
        <h2 className="text-[13px] font-medium tracking-[0.28em] text-stone-900 uppercase md:text-sm">{title}</h2>
      </div>
      <CatalogFilterBar
        chips={chips}
        activeKey={activeKey}
        onSelect={setActiveKey}
        totalCount={totalCount}
        scrollAnchorRef={anchorRef}
        className="mt-4"
      />
      <div ref={anchorRef} className="mx-auto max-w-6xl px-3 pt-5 sm:px-5 md:px-6 md:pt-8">
        <AllScarvesGrid
          key={activeKey}
          productType={productType}
          excludeIds={excludeIds}
          filterParams={chipQueryParams(activeChip)}
        />
      </div>
    </section>
  )
}

/** Collection pages that already hold the whole list (/chales): chips filter in memory. */
export function FilterableProductGrid({
  scarves,
  chips,
  initialFilter,
}: {
  scarves: StorefrontScarf[]
  chips: FilterChip[]
  initialFilter?: string
}) {
  const { activeKey, activeChip, setActiveKey } = useChipSelection(chips, initialFilter)
  const anchorRef = useRef<HTMLDivElement>(null)
  const visible = activeChip ? scarves.filter((s) => productMatchesChip(s, activeChip)) : scarves

  return (
    <>
      <CatalogFilterBar
        chips={chips}
        activeKey={activeKey}
        onSelect={setActiveKey}
        totalCount={scarves.length}
        scrollAnchorRef={anchorRef}
      />
      <div ref={anchorRef} className="mx-auto w-full max-w-6xl px-3 pt-5 pb-16 sm:px-5 md:px-6 md:pt-8">
        <ProductGrid key={activeKey} scarves={visible} />
      </div>
    </>
  )
}
