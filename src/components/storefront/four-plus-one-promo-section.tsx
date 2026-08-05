import Link from "next/link"
import { Gift, ShoppingBag, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { deliveryPromo } from "@/components/storefront/delivery-promo-styles"
import { PROMO_FREE_ITEM_MIN_ITEMS } from "@/lib/cart/pricing"
import { TOUTES_LES_PIECES_PATH } from "@/lib/routes"
import { cn } from "@/lib/utils"

const tierTitleClass = cn(
  deliveryPromo.heading,
  "mt-6 max-w-[min(100%,18rem)] text-balance text-sm leading-[1.25] sm:max-w-none sm:text-base md:text-lg md:tracking-[0.24em] lg:text-xl lg:tracking-[0.26em]",
)

const tierBodyClass = cn(deliveryPromo.body, "mt-3")

/** Post-hero band — active promo variant: "4+1" (cheapest piece offered from 5 pièces). Archived sibling: `DeliveryPromoSection`. */
export function FourPlusOnePromoSection({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-stone-200/90 bg-[#faf9f7] text-stone-900",
        className,
      )}
      aria-label="Promotion 4 plus 1"
    >
      <div
        className="pointer-events-none absolute -left-4 top-1/2 -translate-y-1/2 select-none font-sans text-[clamp(6.5rem,18vw,12rem)] font-light leading-none text-stone-200/35"
        aria-hidden
      >
        +1
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16 lg:py-20">
        <div className="text-center">
          <p className="text-[11px] font-medium tracking-[0.28em] text-[#666666] uppercase sm:text-xs">
            Promotion
          </p>
          <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight text-[#1a1a1a] sm:text-3xl md:text-[2.15rem] md:leading-snug">
            4 + 1 gratuit —{" "}
            <span className="font-normal text-[#555555]">à partir de</span>{" "}
            <span className="text-[#1a1a1a]">{PROMO_FREE_ITEM_MIN_ITEMS} pièces</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-[#555555] md:text-[15px]">
            Dès cinq châles dans votre panier, le moins cher d&apos;entre eux vous est offert
            automatiquement.
          </p>
        </div>

        <div className="mt-12 border border-stone-200/90 bg-white md:mt-16">
          <ul className="grid md:grid-cols-3 md:divide-x md:divide-stone-200/90">
            <li className="flex flex-col border-b border-stone-200/90 p-8 md:border-b-0 md:p-10 lg:p-12">
              <div className={deliveryPromo.iconBox}>
                <ShoppingBag className="size-5 stroke-[1.5]" aria-hidden />
              </div>
              <p className={tierTitleClass}>Tout le catalogue</p>
              <p className="mt-4 text-[11px] font-normal uppercase tracking-[0.14em] text-[#666666]">
                Sans exception
              </p>
              <p className={tierBodyClass}>
                Crêpe, mousseline, lin, satin — la promotion s&apos;applique à l&apos;ensemble des
                pièces, quelle que soit la matière choisie.
              </p>
            </li>

            <li className="flex flex-col border-b border-stone-200/90 bg-[#fcfbfa] p-8 md:border-b-0 md:p-10 lg:p-12">
              <div className={deliveryPromo.iconBox}>
                <Gift className="size-5 stroke-[1.5]" aria-hidden />
              </div>
              <p className={tierTitleClass}>{`Dès ${PROMO_FREE_ITEM_MIN_ITEMS} pièces`}</p>
              <p
                className={cn(
                  deliveryPromo.accent,
                  "mt-4 text-2xl font-normal leading-tight tracking-tight md:text-[1.75rem]",
                )}
              >
                + 1 pièce offerte
              </p>
              <p className={cn(tierBodyClass, "mt-4")}>
                Ajoutez une cinquième pièce à votre panier : la moins chère de votre sélection est
                automatiquement déduite du total.
              </p>
            </li>

            <li className="flex flex-col p-8 md:p-10 lg:p-12">
              <div className={deliveryPromo.iconBox}>
                <Truck className="size-5 stroke-[1.5]" aria-hidden />
              </div>
              <p className={tierTitleClass}>Envoi soigné</p>
              <p className="mt-4 text-[11px] font-normal uppercase tracking-[0.14em] text-[#666666]">
                Emballage & suivi
              </p>
              <p className={tierBodyClass}>
                Colis protégés pour vos châles ; délais selon votre ville, avec les partenaires que
                nous sélectionnons pour vous.
              </p>
            </li>
          </ul>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:mt-12 sm:flex-row sm:gap-10 md:mt-14">
          <Button
            size="lg"
            variant="outline"
            className="h-12 min-w-48 rounded-none border-2 border-[#1a1a1a] bg-transparent px-8 text-xs font-medium tracking-[0.2em] text-[#1a1a1a] uppercase shadow-none hover:bg-[#1a1a1a] hover:text-white"
            asChild
          >
            <Link href={TOUTES_LES_PIECES_PATH}>Voir le catalogue</Link>
          </Button>
          <p className="max-w-md text-center text-xs leading-relaxed text-[#666666] sm:text-left">
            Offre 4+1 — sous réserve de disponibilité. Le tarif s&apos;applique automatiquement au
            panier dès cinq pièces.
          </p>
        </div>
      </div>
    </section>
  )
}
