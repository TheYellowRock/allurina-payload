"use client"

import { useEffect, useMemo, useState } from "react"

import { ScarfCard } from "@/components/storefront/scarf-card"
import type { StorefrontScarf } from "@/lib/storefront-scarf-types"

export function CheckoutUpsellGrid({
  excludeProductIds,
  excludeSlugs = [],
}: {
  /** Cart line `productId` values — matched against `String(scarf.id)`. */
  excludeProductIds: string[]
  /** Cart line slugs — extra guard if ids ever differ in format. */
  excludeSlugs?: string[]
}) {
  const [scarves, setScarves] = useState<StorefrontScarf[] | null>(null)

  const excludeIds = useMemo(() => new Set(excludeProductIds), [excludeProductIds])
  const excludeSlugSet = useMemo(() => new Set(excludeSlugs), [excludeSlugs])

  const picks = useMemo(() => {
    if (!scarves) return []
    return scarves
      .filter(
        (s) => !excludeIds.has(String(s.id)) && !excludeSlugSet.has(s.slug),
      )
      .slice(0, 4)
  }, [scarves, excludeIds, excludeSlugSet])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/store/scarves")
        const data = (await res.json()) as { scarves?: StorefrontScarf[] }
        if (cancelled) return
        setScarves(Array.isArray(data.scarves) ? data.scarves : [])
      } catch {
        if (!cancelled) setScarves([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (picks.length === 0) return null

  return (
    <section
      className="border border-stone-200 bg-white p-5 md:p-6"
      aria-label="Suggestions pour compléter votre commande"
    >
      <h2 className="text-xs font-light uppercase tracking-[0.22em] text-stone-500">
        Complétez votre panier
      </h2>
      <p className="mt-1.5 text-[11px] font-light leading-relaxed text-stone-500">
        Suggestions hors panier — ajout en un clic.
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
        {picks.map((scarf, i) => (
          <li key={String(scarf.id)} className="min-w-0">
            <ScarfCard scarf={scarf} cardIndex={i} />
          </li>
        ))}
      </ul>
    </section>
  )
}
