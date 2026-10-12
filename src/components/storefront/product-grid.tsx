import type { ReactNode } from "react"

import { ScarfCard, type ProductCardLayout } from "@/components/storefront/scarf-card"
import type { StorefrontScarf } from "@/lib/storefront-scarf-types"
import { cn } from "@/lib/utils"

/** Every 5th product on phones is shown full width: 4 small, 1 large, 4 small… */
const FEATURE_EVERY = 5

export function productLayoutAt(index: number): ProductCardLayout {
  return index % FEATURE_EVERY === FEATURE_EVERY - 1 ? "feature" : "grid"
}

/** Grid classes shared with skeletons so loading and loaded states line up exactly. */
export const PRODUCT_GRID_CLASS = "grid grid-cols-2 gap-x-2 gap-y-8 sm:gap-x-4 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-12"

export function productCellClass(index: number): string {
  // Full width on phones/tablets only; on desktop (4 columns) every card is the same size.
  return cn("min-w-0", productLayoutAt(index) === "feature" && "col-span-2 lg:col-span-1")
}

/**
 * Editorial product grid: two columns on phones with one full-width product every five,
 * generous vertical spacing, four even columns on desktop. Used by every product listing.
 */
export function ProductGrid({
  scarves,
  children,
  className,
}: {
  scarves: StorefrontScarf[]
  /** Extra cells appended after the products (e.g. loading skeletons). */
  children?: ReactNode
  className?: string
}) {
  return (
    <ul className={cn(PRODUCT_GRID_CLASS, className)}>
      {scarves.map((scarf, i) => (
        <li key={String(scarf.id)} className={productCellClass(i)}>
          <ScarfCard scarf={scarf} cardIndex={i} layout={productLayoutAt(i)} />
        </li>
      ))}
      {children}
    </ul>
  )
}

export function ProductCardSkeleton({ layout = "grid" }: { layout?: ProductCardLayout }) {
  return (
    <div className="min-w-0 animate-pulse">
      <div className={cn("w-full bg-stone-200/70", layout === "feature" ? "aspect-4/5 lg:aspect-3/4" : "aspect-3/4")} />
      <div className="mt-2.5 space-y-1.5 px-0.5">
        <div className="h-3 w-3/4 bg-stone-200/70" />
        <div className="h-3 w-1/4 bg-stone-200/70" />
      </div>
    </div>
  )
}
