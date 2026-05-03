import Link from "next/link"
import { Package, Percent, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TOUTES_LES_PIECES_PATH } from "@/lib/routes"
import { cn } from "@/lib/utils"

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
              <div className="flex size-11 items-center justify-center border border-stone-200 bg-[#faf9f7] text-stone-600">
                <Percent className="size-5 stroke-[1.5]" aria-hidden />
              </div>
              <p className="mt-8 text-[11px] font-medium tracking-[0.22em] text-stone-500 uppercase">
                À l&apos;unité
              </p>
              <p className="mt-3 text-4xl font-light tabular-nums tracking-tight text-stone-900 md:text-[2.75rem]">
                65 <span className="text-base font-normal text-stone-500 md:text-lg">DH</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                Au lieu de{" "}
                <span className="tabular-nums text-stone-400 line-through decoration-stone-300">
                  75 DH
                </span>
                <span className="mt-2 block text-stone-700">≈ 13&nbsp;% de remise</span>
              </p>
            </li>

            <li className="flex flex-col border-b border-stone-200/90 bg-[#fcfbfa] p-8 md:border-b-0 md:p-10 lg:p-12">
              <div className="flex size-11 items-center justify-center border border-stone-200 bg-white text-stone-600">
                <Package className="size-5 stroke-[1.5]" aria-hidden />
              </div>
              <p className="mt-8 text-[11px] font-medium tracking-[0.22em] text-stone-500 uppercase">
                Package de 3 pièces
              </p>
              <p className="mt-3 text-4xl font-light tabular-nums tracking-tight text-stone-900 md:text-[2.75rem]">
                180 <span className="text-base font-normal text-stone-500 md:text-lg">DH</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                Au lieu de{" "}
                <span className="tabular-nums text-stone-400 line-through decoration-stone-300">
                  195 DH
                </span>
                <span className="mt-2 block text-stone-700">Économisez 15 DH sur le package</span>
              </p>
            </li>

            <li className="flex flex-col p-8 md:p-10 lg:p-12">
              <div className="flex size-11 items-center justify-center border border-stone-200 bg-[#faf9f7] text-stone-600">
                <Truck className="size-5 stroke-[1.5]" aria-hidden />
              </div>
              <p className="mt-8 text-[11px] font-medium tracking-[0.22em] text-stone-500 uppercase">
                À partir de 5 pièces
              </p>
              <p className="mt-3 text-3xl font-light leading-snug tracking-tight text-stone-900 md:text-4xl">
                Livraison
                <span className="mt-1 block text-2xl font-normal text-stone-700 md:text-3xl">
                  gratuite
                </span>
              </p>
              <p className="mt-4 text-sm leading-relaxed text-stone-600">
                Frais de port offerts dès cinq articles dans votre commande.
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
