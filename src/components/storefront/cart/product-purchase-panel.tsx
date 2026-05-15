"use client"

import { useId, useState } from "react"

import { AddToCartButton } from "@/components/storefront/cart/add-to-cart-button"
import { cn } from "@/lib/utils"

export type ProductPurchasePayload = {
  productId: string
  slug: string
  title: string
  price: number
  imageSrc: string | null
}

export function ProductPurchasePanel({
  product,
  purchaseDisabled = false,
}: {
  product: ProductPurchasePayload
  /** When true (e.g. rupture de stock), quantity and add-to-cart are blocked. */
  purchaseDisabled?: boolean
}) {
  const [qty, setQty] = useState(1)
  const qtyId = useId()

  const clampQty = (n: number) => {
    if (!Number.isFinite(n) || n < 1) return 1
    return Math.min(99, Math.floor(n))
  }

  return (
    <div className="mt-8 space-y-4 border-t border-stone-200 pt-8">
      <label
        htmlFor={qtyId}
        className="block text-xs font-light uppercase tracking-widest text-stone-500"
      >
        Quantité
        <input
          id={qtyId}
          type="number"
          min={1}
          max={99}
          value={qty}
          disabled={purchaseDisabled}
          onChange={(e) => setQty(clampQty(Number(e.target.value)))}
          className={cn(
            "mt-2 block h-11 w-20 border border-stone-300 bg-white px-3 text-base font-light tabular-nums",
            "outline-none focus-visible:border-stone-900 focus-visible:ring-1 focus-visible:ring-stone-900",
          )}
        />
      </label>

      <AddToCartButton
        disabled={purchaseDisabled}
        item={{
          productId: product.productId,
          slug: product.slug,
          title: product.title,
          price: product.price,
          imageSrc: product.imageSrc,
          quantity: qty,
        }}
        size="lg"
        variant="default"
        className={cn(
          "h-12 w-full rounded-none border-2 border-stone-900 bg-stone-900 text-sm font-light tracking-[0.2em] text-white uppercase hover:bg-stone-800",
          purchaseDisabled && "border-stone-400 bg-stone-400 text-stone-100 hover:bg-stone-400",
        )}
        openDrawer
      >
        {purchaseDisabled ? "Rupture de stock" : "Ajouter au panier"}
      </AddToCartButton>

      <p className="text-center text-xs font-light text-stone-500">
        Livraison au Maroc — paiement sécurisé (bientôt).
      </p>
    </div>
  )
}
