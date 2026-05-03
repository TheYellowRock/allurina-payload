"use client"

import type { ComponentProps } from "react"
import { ShoppingBag } from "lucide-react"

import { useCart } from "@/components/storefront/cart/cart-context"
import { Button } from "@/components/ui/button"
import type { CartAddPayload } from "@/lib/cart/types"
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
        if (openDrawer) openCart()
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
