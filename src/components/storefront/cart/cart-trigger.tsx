"use client"

import { ShoppingBag } from "lucide-react"

import { useCart } from "@/components/storefront/cart/cart-context"
import { cn } from "@/lib/utils"

export function CartTrigger({
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "type" | "children">) {
  const { toggleCart, itemCount, hydrated } = useCart()

  return (
    <button
      type="button"
      className={cn(
        "relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-none text-stone-800 outline-none transition-colors hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-stone-900/20",
        className,
      )}
      onClick={toggleCart}
      aria-label={
        hydrated && itemCount > 0
          ? `Panier, ${itemCount} article${itemCount > 1 ? "s" : ""}`
          : "Ouvrir le panier"
      }
      {...props}
    >
      <ShoppingBag className="size-5" strokeWidth={1.75} />
      {hydrated && itemCount > 0 ? (
        <span className="absolute right-1 top-1 flex min-w-4 justify-center rounded-full bg-stone-900 px-1 text-[10px] font-medium leading-4 text-white">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      ) : null}
    </button>
  )
}
