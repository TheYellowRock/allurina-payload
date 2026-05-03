import type { Metadata } from "next"

import { CheckoutPageView } from "@/components/storefront/checkout/checkout-page-view"

export const metadata: Metadata = {
  title: "Commande — Allurina",
  description: "Finalisez votre commande — paiement à la livraison.",
}

export default function CheckoutPage() {
  return (
    <div className="min-h-full flex-1 bg-white text-stone-900">
      <CheckoutPageView />
    </div>
  )
}
