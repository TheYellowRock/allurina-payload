import Link from "next/link"
import { MapPinned, Package, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TOUTES_LES_PIECES_PATH } from "@/lib/routes"
import { cn } from "@/lib/utils"

const tierTitleClass =
  "mt-6 max-w-[min(100%,18rem)] text-balance text-sm font-semibold uppercase leading-[1.25] tracking-[0.18em] text-stone-900 sm:max-w-none sm:text-base md:text-lg md:tracking-[0.2em] lg:text-xl lg:tracking-[0.22em]"

const tierBodyClass = "mt-3 text-sm font-normal leading-relaxed text-stone-600"

/** Post-hero band: same structural layout as the former launch promo block, delivery-focused. */
export function DeliveryPromoSection({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-stone-200/90 bg-[#faf9f7] text-stone-900",
        className,
      )}
      aria-label="Livraison au Maroc"
    >
      <div
        className="pointer-events-none absolute -left-4 top-1/2 -translate-y-1/2 select-none font-sans text-[clamp(6.5rem,18vw,12rem)] font-light leading-none text-stone-200/35"
        aria-hidden
      >
        5
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16 lg:py-20">
        <div className="text-center">
          <p className="text-[11px] font-medium tracking-[0.32em] text-stone-500 uppercase sm:text-xs">
            Livraison
          </p>
          <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl md:text-[2.15rem] md:leading-snug">
            Gratuite partout au Maroc —{" "}
            <span className="font-normal text-stone-600">à partir de</span>{" "}
            <span className="text-stone-800">5 pièces</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-stone-600 md:text-[15px]">
            Dès cinq articles dans votre panier, les frais de livraison sont offerts sur l&apos;ensemble
            du territoire marocain.
          </p>
        </div>

        <div className="mt-12 border border-stone-200/90 bg-white md:mt-16">
          <ul className="grid md:grid-cols-3 md:divide-x md:divide-stone-200/90">
            <li className="flex flex-col border-b border-stone-200/90 p-8 md:border-b-0 md:p-10 lg:p-12">
              <div className="flex size-11 items-center justify-center border border-stone-200 bg-[#faf9f7] text-stone-500">
                <MapPinned className="size-5 stroke-[1.5]" aria-hidden />
              </div>
              <p className={tierTitleClass}>Partout au Maroc</p>
              <p className="mt-4 text-[11px] font-normal uppercase tracking-[0.14em] text-stone-500">
                Couverture nationale
              </p>
              <p className={tierBodyClass}>
                Livraison à domicile dans les principales villes et régions : le même engagement, du nord au
                sud du royaume.
              </p>
            </li>

            <li className="flex flex-col border-b border-stone-200/90 bg-[#fcfbfa] p-8 md:border-b-0 md:p-10 lg:p-12">
              <div className="flex size-11 items-center justify-center border border-stone-200 bg-white text-stone-500">
                <Package className="size-5 stroke-[1.5]" aria-hidden />
              </div>
              <p className={tierTitleClass}>Dès 5 pièces</p>
              <p className="mt-4 text-2xl font-light leading-tight tracking-tight text-red-600 md:text-[1.75rem]">
                + Livraison gratuite
              </p>
              <p className={cn(tierBodyClass, "mt-4")}>
                Atteignez cinq pièces dans le panier : les frais de port sont automatiquement supprimés sur
                votre commande.
              </p>
            </li>

            <li className="flex flex-col p-8 md:p-10 lg:p-12">
              <div className="flex size-11 items-center justify-center border border-stone-200 bg-[#faf9f7] text-stone-500">
                <Truck className="size-5 stroke-[1.5]" aria-hidden />
              </div>
              <p className={tierTitleClass}>Envoi soigné</p>
              <p className="mt-4 text-[11px] font-normal uppercase tracking-[0.14em] text-stone-500">
                Emballage & suivi
              </p>
              <p className={tierBodyClass}>
                Colis protégés pour vos châles ; délais selon votre ville, avec les partenaires que nous
                sélectionnons pour vous.
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
            Conditions détaillées dans le panier au moment du récapitulatif — offre de port sous réserve des
            règles en vigueur sur votre commande.
          </p>
        </div>
      </div>
    </section>
  )
}
