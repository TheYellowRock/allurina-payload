import Link from "next/link"
import { Package, Percent, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TOUTES_LES_PIECES_PATH } from "@/lib/routes"
import { cn } from "@/lib/utils"

const tierTitleClass =
  "mt-6 max-w-[min(100%,18rem)] text-balance text-sm font-semibold uppercase leading-[1.25] tracking-[0.18em] text-stone-900 sm:max-w-none sm:text-base md:text-lg md:tracking-[0.2em] lg:text-xl lg:tracking-[0.22em]"

/** Unified copy rhythm: same catalogue reference, then the tier-specific detail. */
const tierBodyClass = "mt-3 text-sm font-normal leading-relaxed text-stone-600"

export function LaunchPromoBanner({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-stone-200/90 bg-[#faf9f7] text-stone-900",
        className,
      )}
      aria-label="Offres de lancement"
    >
      <div
        className="pointer-events-none absolute -left-6 top-1/2 -translate-y-1/2 select-none font-sans text-[clamp(7rem,20vw,14rem)] font-light leading-none text-stone-200/35"
        aria-hidden
      >
        %
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16 lg:py-20">
        <div className="text-center">
          <p className="text-[11px] font-medium tracking-[0.32em] text-stone-500 uppercase sm:text-xs">
            Lancement du site
          </p>
          <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl md:text-[2.15rem] md:leading-snug">
            Offres d&apos;ouverture —{" "}
            <span className="font-normal text-stone-600">profitez du</span>{" "}
            <span className="text-stone-800">%</span>{" "}
            <span className="font-normal text-stone-600">maintenant</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-stone-600 md:text-[15px]">
            Prix catalogue adoucis et avantages cumulables pour marquer l&apos;ouverture de la
            boutique.
          </p>
        </div>

        <div className="mt-12 border border-stone-200/90 bg-white md:mt-16">
          <ul className="grid md:grid-cols-3 md:divide-x md:divide-stone-200/90">
            <li className="flex flex-col border-b border-stone-200/90 p-8 md:border-b-0 md:p-10 lg:p-12">
              <div className="flex size-11 items-center justify-center border border-stone-200 bg-[#faf9f7] text-stone-500">
                <Percent className="size-5 stroke-[1.5]" aria-hidden />
              </div>
              <p className={tierTitleClass}>
                Pour 1 seul chale
              </p>
              <div className="mt-4 flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                <span className="font-light tabular-nums text-[1.625rem] leading-none text-stone-800 line-through decoration-stone-700 decoration-1 md:text-[1.875rem]">
                  80
                </span>
                <span className="inline-flex items-baseline gap-0.5 tabular-nums text-[2.125rem] font-medium leading-none text-red-600 md:text-[2.5rem]">
                  65
                  <span className="text-base font-normal text-red-600/90 md:text-lg">DH</span>
                </span>
                <span className="text-[11px] font-normal leading-none tracking-tight text-stone-500 md:text-xs">
                  par chale
                </span>
              </div>
              <p className={tierBodyClass}>
                Prix catalogue 80&nbsp;DH barré — 65&nbsp;DH / chale, soit environ 19&nbsp;% d&apos;économie.
              </p>
            </li>

            <li className="flex flex-col border-b border-stone-200/90 bg-[#fcfbfa] p-8 md:border-b-0 md:p-10 lg:p-12">
              <div className="flex size-11 items-center justify-center border border-stone-200 bg-white text-stone-500">
                <Package className="size-5 stroke-[1.5]" aria-hidden />
              </div>
              <p className={tierTitleClass}>
                Package de 3 chales
              </p>
              <div className="mt-4 flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                <span className="font-light tabular-nums text-[1.625rem] leading-none text-stone-800 line-through decoration-stone-700 decoration-1 md:text-[1.875rem]">
                  80
                </span>
                <span className="inline-flex items-baseline gap-0.5 tabular-nums text-[2.125rem] font-medium leading-none text-red-600 md:text-[2.5rem]">
                  60
                  <span className="text-base font-normal text-red-600/90 md:text-lg">DH</span>
                </span>
                <span className="text-[11px] font-normal leading-none tracking-tight text-stone-500 md:text-xs">
                  par chale · lot de 3
                </span>
              </div>
              <p className={tierBodyClass}>
                Prix catalogue 80&nbsp;DH barré — 60&nbsp;DH / chale, lot de 3 (180&nbsp;DH).
              </p>
            </li>

            <li className="flex flex-col p-8 md:p-10 lg:p-12">
              <div className="flex size-11 items-center justify-center border border-stone-200 bg-[#faf9f7] text-stone-500">
                <Truck className="size-5 stroke-[1.5]" aria-hidden />
              </div>
              <p className={tierTitleClass}>
                Box de 5 chales
              </p>
              <div className="mt-4 flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                <span className="font-light tabular-nums text-[1.625rem] leading-none text-stone-800 line-through decoration-stone-700 decoration-1 md:text-[1.875rem]">
                  80
                </span>
                <span className="inline-flex items-baseline gap-0.5 tabular-nums text-[2.125rem] font-medium leading-none text-red-600 md:text-[2.5rem]">
                  60
                  <span className="text-base font-normal text-red-600/90 md:text-lg">DH</span>
                </span>
                <span className="text-[11px] font-normal leading-none tracking-tight text-stone-500 md:text-xs">
                  par chale
                </span>
              </div>
              <p className="mt-3 text-2xl font-light leading-tight tracking-tight text-red-600 md:text-[1.75rem]">
                + Livraison gratuite
              </p>
              <p className={tierBodyClass}>
                Prix catalogue 80&nbsp;DH barré — 60&nbsp;DH / chale, box de 5.
              </p>
            </li>
          </ul>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:mt-12 sm:flex-row sm:gap-10 md:mt-14">
          <Button
            size="lg"
            variant="outline"
            className="h-12 min-w-48 rounded-none border-2 border-stone-900 bg-transparent px-8 text-xs font-medium tracking-[0.2em] text-stone-900 uppercase shadow-none hover:bg-stone-900 hover:text-white"
            asChild
          >
            <Link href={TOUTES_LES_PIECES_PATH}>Voir le catalogue</Link>
          </Button>
          <p className="max-w-md text-center text-xs leading-relaxed text-stone-500 sm:text-left">
            Offres de lancement — sous réserve de disponibilité. Les tarifs s&apos;appliquent au
            panier selon les conditions indiquées.
          </p>
        </div>
      </div>
    </section>
  )
}
