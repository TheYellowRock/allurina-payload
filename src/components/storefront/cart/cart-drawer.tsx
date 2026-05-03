"use client"

import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"

import { useCart } from "@/components/storefront/cart/cart-context"
import { CartPricingBreakdownView } from "@/components/storefront/cart/cart-pricing-breakdown"
import { Button } from "@/components/ui/button"
import { CHECKOUT_PATH, NOUVEAUTES_PATH, productPath } from "@/lib/routes"
import { formatScarfPrice } from "@/lib/storefront-scarf-display"

function useLockBody(open: boolean) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])
}

export function CartDrawer() {
  const {
    items,
    open,
    closeCart,
    pricing,
    hydrated,
    setQuantity,
    removeItem,
  } = useCart()

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true)
    })
  }, [])

  useLockBody(open && mounted)

  const onEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart()
    },
    [closeCart],
  )

  useEffect(() => {
    if (!open) return
    window.addEventListener("keydown", onEscape)
    return () => window.removeEventListener("keydown", onEscape)
  }, [open, onEscape])

  if (!mounted || !open) return null

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[110] bg-stone-900/45 backdrop-blur-[2px]"
        aria-label="Fermer le panier"
        onClick={closeCart}
      />
      <aside
        className="fixed inset-y-0 right-0 z-[111] flex w-full max-w-md flex-col bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        <header className="flex items-center justify-between border-b border-stone-200 px-4 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-stone-700" strokeWidth={1.5} />
            <h2
              id="cart-drawer-title"
              className="text-lg font-light tracking-wide text-stone-900"
            >
              Panier
            </h2>
            {hydrated && items.length > 0 ? (
              <span className="text-sm font-light text-stone-500">
                ({items.reduce((a, i) => a + i.quantity, 0)})
              </span>
            ) : null}
          </div>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-none text-stone-800 outline-none transition-colors hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-stone-900/20"
            onClick={closeCart}
            aria-label="Fermer"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          {!hydrated ? (
            <p className="p-6 text-sm font-light text-stone-500">Chargement…</p>
          ) : items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
              <ShoppingBag className="size-12 text-stone-300" strokeWidth={1} />
              <p className="text-sm font-light text-stone-600">Votre panier est vide.</p>
              <Button
                type="button"
                variant="outline"
                className="rounded-none border-stone-300 font-light"
                onClick={closeCart}
                asChild
              >
                <Link href={NOUVEAUTES_PATH}>Continuer les achats</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {items.map((line) => (
                <li key={line.productId} className="flex gap-3 px-4 py-4">
                  <Link
                    href={productPath(line.slug)}
                    onClick={closeCart}
                    className="relative size-20 shrink-0 overflow-hidden bg-stone-100"
                  >
                    {line.imageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={line.imageSrc}
                        alt=""
                        className="absolute inset-0 size-full object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-[10px] text-stone-400">
                        —
                      </span>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={productPath(line.slug)}
                      onClick={closeCart}
                      className="line-clamp-2 text-sm font-light leading-snug text-stone-900 hover:underline"
                    >
                      {line.title}
                    </Link>
                    <p className="mt-1 text-sm font-light tabular-nums text-stone-700">
                      {formatScarfPrice(line.price)}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="inline-flex items-center border border-stone-200">
                        <button
                          type="button"
                          className="flex size-8 items-center justify-center text-stone-700 hover:bg-stone-50"
                          aria-label="Diminuer la quantité"
                          onClick={() =>
                            setQuantity(line.productId, line.quantity - 1)
                          }
                        >
                          <Minus className="size-3.5" strokeWidth={1.5} />
                        </button>
                        <span className="min-w-8 text-center text-xs font-light tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          className="flex size-8 items-center justify-center text-stone-700 hover:bg-stone-50"
                          aria-label="Augmenter la quantité"
                          onClick={() =>
                            setQuantity(line.productId, line.quantity + 1)
                          }
                        >
                          <Plus className="size-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="ml-auto inline-flex size-8 items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                        aria-label={`Retirer ${line.title}`}
                        onClick={() => removeItem(line.productId)}
                      >
                        <Trash2 className="size-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {hydrated && items.length > 0 ? (
          <footer className="border-t border-stone-200 bg-stone-50/80 px-4 py-5">
            <CartPricingBreakdownView pricing={pricing} />
            <p className="mt-3 text-center text-[11px] font-light leading-relaxed text-stone-500">
              Remises appliquées automatiquement à partir de 3 pièces ; livraison offerte dès 5
              pièces.
            </p>
            <Button
              asChild
              className="mt-4 h-11 w-full rounded-none border-2 border-stone-900 bg-stone-900 text-xs font-light tracking-[0.2em] text-white uppercase hover:bg-stone-800"
            >
              <Link href={CHECKOUT_PATH} onClick={closeCart}>
                Commander
              </Link>
            </Button>
          </footer>
        ) : null}
      </aside>
    </>,
    document.body,
  )
}
