"use client"

import type { ComponentProps } from "react"
import { useRef } from "react"
import { ShoppingBag } from "lucide-react"
import { toast } from "sonner"

import { useCart } from "@/components/storefront/cart/cart-context"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-is-mobile"
import type { CartAddPayload } from "@/lib/cart/types"
import { readFbc, readFbp } from "@/lib/fb-cookies"
import { gtmTrackAddToCart } from "@/lib/gtm"
import { fbEvent } from "@/lib/pixel"
import { cn } from "@/lib/utils"

/** Lock window for the double-tap guard below — long enough to absorb a fast double-click/tap. */
const DOUBLE_TAP_GUARD_MS = 600

type ButtonProps = ComponentProps<typeof Button>

export function AddToCartButton({
  item,
  openDrawer = true,
  className,
  children,
  size = "default",
  variant = "outline",
  onClick,
  ...buttonProps
}: Omit<ButtonProps, "onClick" | "type"> & {
  item: CartAddPayload
  openDrawer?: boolean
  onClick?: ButtonProps["onClick"]
}) {
  const { addItem, openCart } = useCart()
  const isMobile = useIsMobile()

  // Ref, not state: click handlers run to completion before the next click is dispatched,
  // so only a value checked/set synchronously at the top of the handler — before any
  // re-render — can stop a fast double-tap/double-click from firing the handler twice.
  const isLockedRef = useRef(false)

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(className)}
      {...buttonProps}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        if (isLockedRef.current) return
        isLockedRef.current = true
        setTimeout(() => {
          isLockedRef.current = false
        }, DOUBLE_TAP_GUARD_MS)

        onClick?.(e)
        addItem(item)
        gtmTrackAddToCart({
          title: item.title,
          price: item.price,
          quantity: item.quantity,
        })
        const addToCartEventId = crypto.randomUUID()
        fbEvent(
          "AddToCart",
          {
            content_ids: [item.productId],
            content_type: "product",
            value: item.price * item.quantity,
            currency: "MAD",
          },
          addToCartEventId,
        )
        void fetch("/api/pixel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventName: "AddToCart",
            eventData: {
              eventId: addToCartEventId,
              products: [{ id: item.productId, quantity: item.quantity, item_price: item.price }],
              value: item.price * item.quantity,
              fbp: readFbp() ?? undefined,
              fbc: readFbc() ?? undefined,
            },
          }),
        })
        if (isMobile) {
          toast.success("Ajouté au panier !")
        }
        if (openDrawer && !isMobile) {
          openCart()
        }
      }}
    >
      {children ?? (
        <>
          <ShoppingBag className="size-3.5 opacity-70" strokeWidth={1.5} />
          Ajouter
        </>
      )}
    </Button>
  )
}
