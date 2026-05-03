"use client"

import Link from "next/link"

import { brandLogoSerif } from "@/components/storefront/brand-logo-font"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NOUVEAUTES_PATH, TOUTES_LES_PIECES_PATH } from "@/lib/routes"
import { cn } from "@/lib/utils"

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-stone-50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:px-6 lg:grid-cols-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-stone-500 uppercase">
            Newsletter
          </p>
          <p className="mt-2 text-sm text-stone-600">
            Inscrivez-vous pour recevoir les nouveautés et offres exclusives.
          </p>
          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row"
            action="#"
            onSubmit={(e) => e.preventDefault()}
          >
            <Input
              type="email"
              name="email"
              placeholder="Votre e-mail"
              className="h-10 border-stone-300 bg-white"
              aria-label="E-mail"
            />
            <Button type="submit" className="h-10 shrink-0 bg-stone-900 text-white hover:bg-stone-800">
              S&apos;inscrire
            </Button>
          </form>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-stone-500 uppercase">
            Boutique
          </p>
          <ul className="mt-4 space-y-2 text-sm text-stone-600">
            <li>
              <Link href={NOUVEAUTES_PATH} className="hover:text-stone-900">
                Nouveautés
              </Link>
            </li>
            <li>
              <Link href={TOUTES_LES_PIECES_PATH} className="hover:text-stone-900">
                Toutes les pièces
              </Link>
            </li>
            <li>
              <Link href="/api/store/scarves" className="hover:text-stone-900" prefetch={false}>
                API catalogue (JSON)
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-2 lg:col-span-1">
          <p
            className={cn(
              brandLogoSerif.className,
              "text-[1.35rem] leading-none tracking-[0.04em] text-stone-900 normal-case sm:text-[1.5rem]",
            )}
          >
            AllurinaScarf
          </p>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            Châles et foulards pensés pour le quotidien : matières nobles, couleurs
            intemporelles, finitions soignées. Une expérience d&apos;achat simple et
            transparente — disponibilité et stocks synchronisés avec notre atelier.
          </p>
        </div>
      </div>

      <div className="border-t border-stone-200/80 py-4 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} AllurinaScarf — Tous droits réservés
      </div>
    </footer>
  )
}
