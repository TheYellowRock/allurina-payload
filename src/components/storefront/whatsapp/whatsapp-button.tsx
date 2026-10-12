"use client"

import { MessageCircle } from "lucide-react"
import { usePathname } from "next/navigation"

import { useCart } from "@/components/storefront/cart/cart-context"
import { useWhatsAppContext } from "@/components/storefront/whatsapp/whatsapp-context"
import { fbEvent } from "@/lib/pixel"
import { CHECKOUT_PATH } from "@/lib/routes"
import { cn } from "@/lib/utils"

/**
 * Floating click-to-chat button. The number is the one connected to respond.io, so every
 * conversation lands in the same inbox as the order contacts (WhatsApp identifies the
 * contact by phone, same identifier the order sync upserts on).
 *
 * The trailing "(site)" in each message lets a respond.io Workflow tag the contact's
 * source. Keep it if you edit the wording.
 */
export const WHATSAPP_NUMBER = "212696707488"

const CONFIRMATION_PATH = `${CHECKOUT_PATH}/confirmation`

/** Paths where the button never renders (staff area shares the same root layout). */
const HIDDEN_PREFIXES = ["/studio", "/admin"]

function buildMessage(pathname: string, productTitle: string | null): string {
  if (productTitle) {
    return `Salam, j'ai une question sur « ${productTitle} » (site)`
  }
  if (pathname.startsWith(CONFIRMATION_PATH)) {
    return "Salam, j'ai une question sur ma commande (site)"
  }
  if (pathname.startsWith(CHECKOUT_PATH)) {
    return "Salam, j'ai une question avant de valider ma commande (site)"
  }
  return "Salam, j'ai une question (site)"
}

export function WhatsAppButton() {
  const pathname = usePathname() ?? "/"
  const { hydrated, open } = useCart()
  const { productTitle } = useWhatsAppContext()

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null
  // The cart drawer covers the page; the button would sit on top of its CTA.
  if (open) return null

  // Mirrors StickyOfferBar's visibility: it shows everywhere except checkout once hydrated.
  const offerBarVisible = hydrated && !pathname.startsWith(CHECKOUT_PATH)

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    buildMessage(pathname, productTitle),
  )}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        fbEvent("Contact", {
          content_name: productTitle ?? pathname,
          content_category: "whatsapp",
        })
      }
      aria-label="Nous contacter sur WhatsApp"
      title="Une question ? Écrivez-nous sur WhatsApp"
      className={cn(
        "fixed right-4 z-40 flex size-14 items-center justify-center rounded-full",
        "bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform",
        "hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]",
        offerBarVisible
          ? "bottom-[calc(2.75rem+env(safe-area-inset-bottom)+0.75rem)]"
          : "bottom-[calc(env(safe-area-inset-bottom)+1rem)]",
      )}
    >
      <MessageCircle className="size-7" strokeWidth={2} aria-hidden />
    </a>
  )
}
