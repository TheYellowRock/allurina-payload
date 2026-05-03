import type { Metadata } from "next"
import Link from "next/link"

import { NOUVEAUTES_PATH } from "@/lib/routes"

type Props = { searchParams: Promise<{ ref?: string }> }

export const metadata: Metadata = {
  title: "Commande confirmée — Allurina",
}

export default async function CheckoutConfirmationPage({ searchParams }: Props) {
  const { ref } = await searchParams
  const reference = typeof ref === "string" && ref.trim().length > 0 ? ref.trim() : null

  return (
    <div className="min-h-full flex-1 bg-[#faf9f7] text-stone-900">
      <div className="mx-auto max-w-lg px-4 py-20 text-center md:px-6 md:py-24">
        {reference ? (
          <>
            <p className="text-xs font-light uppercase tracking-[0.28em] text-stone-500">
              Merci
            </p>
            <h1 className="mt-4 text-3xl font-light tracking-tight text-stone-900 md:text-4xl">
              Commande enregistrée
            </h1>
            <p className="mt-4 text-pretty text-sm font-light leading-relaxed text-stone-600">
              Nous avons bien enregistré votre commande. Conservez votre numéro de référence
              pour toute question auprès du service client.
            </p>
            <p className="mt-8 text-sm font-light text-stone-700">
              Référence commande
            </p>
            <p className="mt-2 font-mono text-lg font-light tracking-wide text-stone-900">
              {reference}
            </p>
            <p className="mt-6 text-pretty text-sm font-light text-stone-600">
              Mode de paiement : paiement à la livraison. Préparez le montant en espèces à
              remettre au livreur.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-light text-stone-900">Confirmation</h1>
            <p className="mt-3 text-sm font-light text-stone-600">
              Référence de commande manquante. Si vous venez de valider une commande, vérifiez
              votre lien ou votre historique de navigation.
            </p>
          </>
        )}
        <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-11 min-w-[10rem] items-center justify-center border-2 border-stone-900 bg-stone-900 px-6 text-xs font-light tracking-[0.18em] text-white uppercase transition-colors hover:bg-stone-800"
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            href={NOUVEAUTES_PATH}
            className="text-sm font-light text-stone-600 underline underline-offset-4 hover:text-stone-900"
          >
            Continuer les achats
          </Link>
        </div>
      </div>
    </div>
  )
}
