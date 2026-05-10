import Link from "next/link"

import { ScarfCard } from "@/components/storefront/scarf-card"
import { Button } from "@/components/ui/button"
import type { StorefrontScarf } from "@/lib/storefront-scarf-types"
import { cn } from "@/lib/utils"

const PREVIEW_COUNT = 4

export function HomeCategoryPreviewGrid({
  title,
  exploreHref,
  scarves,
  sectionId,
  className,
  variant = "cream",
}: {
  title: string
  exploreHref: string
  scarves: StorefrontScarf[]
  sectionId?: string
  className?: string
  variant?: "cream" | "white"
}) {
  const slice = scarves.slice(0, PREVIEW_COUNT)

  return (
    <section
      id={sectionId}
      className={cn(
        "scroll-mt-28 border-t border-stone-200/80 py-10 md:py-12",
        variant === "white" ? "bg-white" : "bg-[#faf9f7]",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl px-5 md:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-stone-900 md:text-2xl">
            {title}
          </h2>
          <Button
            variant="outline"
            size="sm"
            className="rounded-none border-stone-300 text-xs font-medium tracking-wide uppercase"
            asChild
          >
            <Link href={exploreHref}>Explorer plus</Link>
          </Button>
        </div>

        {slice.length === 0 ? (
          <p className="text-sm font-light text-stone-500">
            Aucune pièce pour le moment — revenez bientôt ou parcourez le catalogue.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-6">
            {slice.map((scarf, i) => (
              <li key={String(scarf.id)} className="min-w-0">
                <ScarfCard scarf={scarf} cardIndex={i} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
