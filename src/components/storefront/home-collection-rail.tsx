import Link from "next/link"
import { Plus } from "lucide-react"

import { ScarfCard } from "@/components/storefront/scarf-card"
import { Button } from "@/components/ui/button"
import type { StorefrontScarf } from "@/lib/storefront-scarf-types"
import { cn } from "@/lib/utils"

const RAIL_LIMIT = 8

export function HomeCollectionRail({
  id,
  kicker = "Sélection",
  title,
  headerActionHref,
  headerActionLabel,
  exploreHref,
  exploreLabel = "Découvrir plus",
  scarves,
  className,
}: {
  id?: string
  kicker?: string
  title: string
  headerActionHref: string
  headerActionLabel: string
  exploreHref: string
  exploreLabel?: string
  scarves: StorefrontScarf[]
  className?: string
}) {
  const slice = scarves.slice(0, RAIL_LIMIT)

  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-28 border-t border-stone-200/80 bg-[#faf9f7] py-16 md:py-20",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-stone-500 uppercase">
              {kicker}
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-stone-900 md:text-4xl">{title}</h2>
          </div>
          <Button variant="outline" size="sm" className="border-stone-300" asChild>
            <Link href={headerActionHref}>{headerActionLabel}</Link>
          </Button>
        </div>

        {slice.length === 0 ? (
          <div className="border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center text-sm text-stone-500">
            Aucune pièce pour cette sélection pour le moment.
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {slice.map((scarf, i) => (
              <li key={String(scarf.id)} className="min-w-0">
                <ScarfCard scarf={scarf} cardIndex={i} />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 flex w-full justify-center">
          <Link
            href={exploreHref}
            className={cn(
              "relative z-10 inline-flex h-12 w-full min-w-0 items-center justify-center gap-2.5 rounded-none border-2 border-stone-900 bg-transparent px-5 text-sm font-medium uppercase tracking-[0.2em] text-stone-900 shadow-none transition-colors",
              "hover:bg-stone-900 hover:text-white active:bg-stone-950 active:text-white",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900",
              "[&_svg]:shrink-0 [&_svg]:text-stone-900 hover:[&_svg]:text-white active:[&_svg]:text-white",
              "md:h-14 md:w-auto md:min-w-[20rem] md:px-10 md:text-base",
            )}
          >
            <Plus className="size-3.5 md:size-4" strokeWidth={1.75} aria-hidden />
            {exploreLabel}
          </Link>
        </div>
      </div>
    </section>
  )
}
