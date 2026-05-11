"use client"

import type { ComponentProps } from "react"
import { ShoppingBag } from "lucide-react"
import { toast } from "sonner"

import { useCart } from "@/components/storefront/cart/cart-context"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-is-mobile"
import type { CartAddPayload } from "@/lib/cart/types"
import { gtmTrackAddToCart } from "@/lib/gtm"
import { cn } from "@/lib/utils"

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
        onClick?.(e)
        addItem(item)
        gtmTrackAddToCart({
          title: item.title,
          price: item.price,
          quantity: item.quantity,
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
