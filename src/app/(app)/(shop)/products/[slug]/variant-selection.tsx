"use client"

import { createContext, useContext, useId, useMemo, useState, type ReactNode } from "react"

import { AddToCartButton } from "@/components/storefront/cart/add-to-cart-button"
import type { StorefrontVariantOptions } from "@/lib/storefront-scarf-types"
import { cn } from "@/lib/utils"

import { ProductGallery } from "./product-gallery"

/**
 * Size × colour selection for products sold in variants (pulls…). One provider wraps the
 * product page grid so the gallery (left column) and the purchase panel (right column)
 * share the chosen colour: picking a colour swaps the photos to that colour's gallery.
 */

type Selection = {
  options: StorefrontVariantOptions
  colorId: string | null
  sizeId: string | null
  setColorId: (id: string) => void
  setSizeId: (id: string | null) => void
}

const SelectionContext = createContext<Selection | null>(null)

function useSelection(): Selection {
  const ctx = useContext(SelectionContext)
  if (!ctx) throw new Error("VariantSelection components must be inside VariantSelectionProvider")
  return ctx
}

function stockOf(options: StorefrontVariantOptions, colorId: string | null, sizeId: string | null): number {
  if (!colorId || !sizeId) return 0
  return options.variants.find((v) => v.colorId === colorId && v.sizeId === sizeId)?.stock ?? 0
}

function colorInStock(options: StorefrontVariantOptions, colorId: string): boolean {
  return options.variants.some((v) => v.colorId === colorId && v.stock > 0)
}

export function VariantSelectionProvider({
  options,
  children,
}: {
  options: StorefrontVariantOptions
  children: ReactNode
}) {
  // Start on the first colour that can actually be bought; no size pre-selected, so the
  // customer always picks one consciously (avoids wrong-size COD returns).
  const firstColor = options.colors.find((c) => colorInStock(options, c.id)) ?? options.colors[0]
  const [colorId, setColorIdState] = useState<string | null>(firstColor?.id ?? null)
  const [sizeId, setSizeId] = useState<string | null>(null)

  const setColorId = (id: string) => {
    setColorIdState(id)
    // Keep the chosen size only if it's still available in the new colour.
    setSizeId((current) => (current && stockOf(options, id, current) > 0 ? current : null))
  }

  return (
    <SelectionContext.Provider value={{ options, colorId, sizeId, setColorId, setSizeId }}>
      {children}
    </SelectionContext.Provider>
  )
}

/** Gallery of the selected colour; falls back to the product's main photos when that colour has none. */
export function VariantGallery({
  fallbackImages,
  productTitle,
  badge,
}: {
  fallbackImages: { src: string; alt: string }[]
  productTitle: string
  badge?: ReactNode
}) {
  const { options, colorId } = useSelection()
  const colorImages = options.colors.find((c) => c.id === colorId)?.images ?? []
  const images = colorImages.length > 0 ? colorImages : fallbackImages
  return <ProductGallery key={colorId ?? "default"} images={images} productTitle={productTitle} badge={badge} />
}

export function VariantPurchasePanel({
  product,
}: {
  product: { productId: string; slug: string; title: string; fallbackImageSrc: string | null }
}) {
  const { options, colorId, sizeId, setColorId, setSizeId } = useSelection()
  const [qty, setQty] = useState(1)
  const qtyId = useId()

  const color = options.colors.find((c) => c.id === colorId) ?? null
  const size = options.sizes.find((s) => s.id === sizeId) ?? null
  const variant = useMemo(
    () => options.variants.find((v) => v.colorId === colorId && v.sizeId === sizeId) ?? null,
    [options.variants, colorId, sizeId],
  )
  const maxQty = Math.max(1, Math.min(99, variant?.stock ?? 1))
  const canBuy = Boolean(variant && variant.stock > 0)

  return (
    <div className="mt-8 space-y-6 border-t border-stone-200 pt-8">
      <fieldset>
        <legend className="text-xs font-light uppercase tracking-widest text-stone-500">
          Couleur{color ? <span className="ml-2 normal-case tracking-normal text-stone-800">{color.name}</span> : null}
        </legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {options.colors.map((c) => {
            const available = colorInStock(options, c.id)
            const selected = c.id === colorId
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setColorId(c.id)}
                aria-pressed={selected}
                aria-label={`${c.name}${available ? "" : " (épuisé)"}`}
                title={c.name}
                className={cn(
                  "relative size-10 rounded-full border-2 transition-shadow",
                  selected ? "border-stone-900 ring-2 ring-white ring-offset-2 ring-offset-stone-900" : "border-stone-300",
                  !available && "opacity-40",
                )}
                style={{ backgroundColor: c.hex }}
              >
                {!available ? (
                  <span className="absolute inset-0 m-auto h-0.5 w-11 -rotate-45 bg-stone-500" aria-hidden />
                ) : null}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-light uppercase tracking-widest text-stone-500">Taille</legend>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {options.sizes.map((s) => {
            const stock = stockOf(options, colorId, s.id)
            const selected = s.id === sizeId
            return (
              <button
                key={s.id}
                type="button"
                disabled={stock <= 0}
                onClick={() => {
                  setSizeId(s.id)
                  setQty(1)
                }}
                aria-pressed={selected}
                className={cn(
                  "h-11 border text-sm font-light tracking-wide transition-colors",
                  selected
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-300 bg-white text-stone-900 hover:border-stone-900",
                  "disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-300 disabled:line-through",
                )}
              >
                {s.label}
              </button>
            )
          })}
        </div>
        {variant && variant.stock > 0 && variant.stock <= 3 ? (
          <p className="mt-2 text-xs font-medium text-[#c00000]">
            Plus que {variant.stock} en stock dans cette taille
          </p>
        ) : null}
      </fieldset>

      <label htmlFor={qtyId} className="block text-xs font-light uppercase tracking-widest text-stone-500">
        Quantité
        <input
          id={qtyId}
          type="number"
          min={1}
          max={maxQty}
          value={qty}
          disabled={!canBuy}
          onChange={(e) => {
            const n = Math.floor(Number(e.target.value))
            setQty(Number.isFinite(n) ? Math.min(maxQty, Math.max(1, n)) : 1)
          }}
          className="mt-2 block h-11 w-20 border border-stone-300 bg-white px-3 text-base font-light tabular-nums outline-none focus-visible:border-stone-900"
        />
      </label>

      <AddToCartButton
        disabled={!canBuy}
        item={{
          productId: product.productId,
          variantId: variant?.id,
          variantLabel: size && color ? `${size.label} · ${color.name}` : undefined,
          slug: product.slug,
          title: product.title,
          price: variant?.price ?? 0,
          imageSrc: color?.images[0]?.src ?? product.fallbackImageSrc,
          quantity: qty,
        }}
        size="lg"
        variant="default"
        className={cn(
          "h-12 w-full rounded-none border-2 border-stone-900 bg-stone-900 text-sm font-light tracking-[0.2em] text-white uppercase hover:bg-stone-800",
          !canBuy &&
            "border-stone-300 bg-stone-100 text-stone-500 hover:border-stone-300 hover:bg-stone-100 disabled:opacity-100!",
        )}
        openDrawer
      >
        {canBuy ? "Ajouter au panier" : sizeId ? "Épuisé" : "Choisissez une taille"}
      </AddToCartButton>
    </div>
  )
}
