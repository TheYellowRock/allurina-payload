"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"

import { useCart } from "@/components/storefront/cart/cart-context"
import {
  CheckoutOrderSummary,
  rowInput,
} from "@/components/storefront/checkout/checkout-order-summary"
import { CheckoutUpsellGrid } from "@/components/storefront/checkout/checkout-upsell-grid"
import { Button } from "@/components/ui/button"
import { checkoutConfirmationPath, NOUVEAUTES_PATH } from "@/lib/routes"

export function CheckoutPageView() {
  const router = useRouter()
  const { items, pricing, hydrated, clearCart } = useCart()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [customerName, setCustomerName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [addressLine1, setAddressLine1] = useState("")
  const [addressLine2, setAddressLine2] = useState("")
  const [city, setCity] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [country, setCountry] = useState("Maroc")
  const [notes, setNotes] = useState("")

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      if (items.length === 0) {
        setError("Votre panier est vide.")
        return
      }
      setPending(true)
      try {
        const res = await fetch("/api/store/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethod: "cod",
            items,
            customer: {
              customerName,
              email,
              phone,
              addressLine1,
              ...(addressLine2.trim() ? { addressLine2: addressLine2.trim() } : {}),
              city,
              postalCode,
              country: country.trim() || "Maroc",
              ...(notes.trim() ? { notes: notes.trim() } : {}),
            },
          }),
        })
        const data = (await res.json()) as { error?: string; orderReference?: string }
        if (!res.ok) {
          setError(data.error ?? "Une erreur est survenue.")
          return
        }
        if (!data.orderReference) {
          setError("Réponse serveur inattendue.")
          return
        }
        clearCart()
        router.push(checkoutConfirmationPath(data.orderReference))
      } catch {
        setError("Réseau indisponible. Réessayez.")
      } finally {
        setPending(false)
      }
    },
    [
      items,
      customerName,
      email,
      phone,
      addressLine1,
      addressLine2,
      city,
      postalCode,
      country,
      notes,
      clearCart,
      router,
    ],
  )

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm font-light text-stone-500 md:px-6">
        Chargement…
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center md:px-6">
        <h1 className="text-2xl font-light text-stone-900">Panier vide</h1>
        <p className="mt-3 text-sm font-light text-stone-600">
          Ajoutez des articles avant de passer commande.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-8 rounded-none border-stone-400 font-light"
          asChild
        >
          <Link href={NOUVEAUTES_PATH}>Voir les nouveautés</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <nav className="text-sm font-light text-stone-600">
        <Link href="/" className="hover:text-stone-900">
          Accueil
        </Link>
        <span className="mx-2 text-stone-400">/</span>
        <span className="text-stone-900">Commande</span>
      </nav>

      <h1 className="mt-6 text-3xl font-light tracking-tight text-stone-900 md:text-4xl">
        Finaliser la commande
      </h1>
      <p className="mt-2 max-w-xl text-sm font-light text-stone-600">
        Renseignez vos coordonnées. Paiement à la livraison — aucun prélèvement en ligne.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
        <form
          onSubmit={onSubmit}
          className="space-y-5 lg:col-span-7"
          noValidate
        >
          <section>
            <h2 className="text-xs font-light uppercase tracking-[0.22em] text-stone-500">
              Coordonnées
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-xs font-light text-stone-600">Nom complet</span>
                <input
                  name="customerName"
                  required
                  autoComplete="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={`mt-1.5 w-full ${rowInput}`}
                />
              </label>
              <label className="block">
                <span className="text-xs font-light text-stone-600">E-mail</span>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`mt-1.5 w-full ${rowInput}`}
                />
              </label>
              <label className="block">
                <span className="text-xs font-light text-stone-600">Téléphone</span>
                <input
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`mt-1.5 w-full ${rowInput}`}
                />
              </label>
            </div>
          </section>

          <section>
            <h2 className="text-xs font-light uppercase tracking-[0.22em] text-stone-500">
              Livraison
            </h2>
            <div className="mt-4 grid gap-4">
              <label className="block">
                <span className="text-xs font-light text-stone-600">Adresse</span>
                <input
                  name="addressLine1"
                  required
                  autoComplete="street-address"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className={`mt-1.5 w-full ${rowInput}`}
                />
              </label>
              <label className="block">
                <span className="text-xs font-light text-stone-600">
                  Complément (optionnel)
                </span>
                <input
                  name="addressLine2"
                  autoComplete="address-line2"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className={`mt-1.5 w-full ${rowInput}`}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-light text-stone-600">Ville</span>
                  <input
                    name="city"
                    required
                    autoComplete="address-level2"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={`mt-1.5 w-full ${rowInput}`}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-light text-stone-600">
                    Code postal (optionnel)
                  </span>
                  <input
                    name="postalCode"
                    autoComplete="postal-code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className={`mt-1.5 w-full ${rowInput}`}
                  />
                </label>
              </div>
              <label className="block sm:max-w-xs">
                <span className="text-xs font-light text-stone-600">Pays</span>
                <input
                  name="country"
                  autoComplete="country-name"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={`mt-1.5 w-full ${rowInput}`}
                />
              </label>
              <label className="block">
                <span className="text-xs font-light text-stone-600">
                  Notes pour la livraison (optionnel)
                </span>
                <textarea
                  name="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`mt-1.5 w-full resize-y py-2.5 ${rowInput}`}
                />
              </label>
            </div>
          </section>

          <section className="border border-stone-200 bg-white p-4">
            <h2 className="text-xs font-light uppercase tracking-[0.22em] text-stone-500">
              Paiement
            </h2>
            <p className="mt-3 text-sm font-light text-stone-800">
              Paiement à la livraison
            </p>
            <p className="mt-2 text-xs font-light leading-relaxed text-stone-600">
              Vous payez à la réception de votre colis. Préparez le montant exact si possible
              (espèces).
            </p>
          </section>

          {error ? (
            <p
              className="border border-red-200 bg-red-50 px-3 py-2 text-sm font-light text-red-800"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button
              type="submit"
              disabled={pending}
              className="h-12 min-w-48 rounded-none border-2 border-stone-900 bg-stone-900 px-8 text-xs font-light tracking-[0.2em] text-white uppercase hover:bg-stone-800 disabled:opacity-60"
            >
              {pending ? "Envoi…" : "Confirmer la commande"}
            </Button>
            <Link
              href="/"
              className="text-sm font-light text-stone-600 underline underline-offset-4 hover:text-stone-900"
            >
              Continuer les achats
            </Link>
          </div>
        </form>

        <div className="space-y-8 lg:col-span-5 lg:pt-1">
          <CheckoutOrderSummary items={items} pricing={pricing} />
          <CheckoutUpsellGrid
            excludeProductIds={items.map((line) => line.productId)}
            excludeSlugs={items.map((line) => line.slug)}
          />
        </div>
      </div>
    </div>
  )
}
