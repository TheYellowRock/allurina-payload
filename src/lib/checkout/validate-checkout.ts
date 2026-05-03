import type { CartLineItem } from "@/lib/cart/types"

import type { CheckoutCustomerPayload, CheckoutRequestPayload } from "./types"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isCartLine(x: unknown): x is CartLineItem {
  if (!x || typeof x !== "object") return false
  const o = x as Record<string, unknown>
  return (
    typeof o.productId === "string" &&
    o.productId.length > 0 &&
    typeof o.slug === "string" &&
    typeof o.title === "string" &&
    typeof o.price === "number" &&
    Number.isFinite(o.price) &&
    o.price >= 0 &&
    typeof o.quantity === "number" &&
    Number.isInteger(o.quantity) &&
    o.quantity >= 1 &&
    (o.imageSrc === null || typeof o.imageSrc === "string")
  )
}

function trim(s: unknown, max: number): string {
  if (typeof s !== "string") return ""
  return s.trim().slice(0, max)
}

export function validateCheckoutBody(
  body: unknown,
): { ok: true; data: CheckoutRequestPayload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Corps de requête invalide." }
  }
  const b = body as Record<string, unknown>

  if (b.paymentMethod !== "cod") {
    return { ok: false, error: "Mode de paiement non accepté." }
  }

  const rawItems = b.items
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { ok: false, error: "Le panier est vide." }
  }
  const items = rawItems.filter(isCartLine)
  if (items.length !== rawItems.length) {
    return { ok: false, error: "Lignes panier invalides." }
  }

  const c = b.customer
  if (!c || typeof c !== "object") {
    return { ok: false, error: "Coordonnées manquantes." }
  }
  const cust = c as Record<string, unknown>

  const customerName = trim(cust.customerName, 200)
  const email = trim(cust.email, 254).toLowerCase()
  const phone = trim(cust.phone, 40)
  const addressLine1 = trim(cust.addressLine1, 300)
  const addressLine2Raw = trim(cust.addressLine2, 300)
  const city = trim(cust.city, 120)
  const postalCode = trim(cust.postalCode, 20)
  const country = trim(cust.country, 80) || "Maroc"
  const notesRaw = trim(cust.notes, 2000)

  if (customerName.length < 2) {
    return { ok: false, error: "Indiquez votre nom complet." }
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Adresse e-mail invalide." }
  }
  if (phone.length < 8) {
    return { ok: false, error: "Numéro de téléphone invalide." }
  }
  if (addressLine1.length < 4) {
    return { ok: false, error: "Adresse trop courte." }
  }
  if (city.length < 2) {
    return { ok: false, error: "Ville manquante." }
  }
  if (postalCode.length < 3) {
    return { ok: false, error: "Code postal invalide." }
  }

  const customer: CheckoutCustomerPayload = {
    customerName,
    email,
    phone,
    addressLine1,
    city,
    postalCode,
    country,
    ...(addressLine2Raw ? { addressLine2: addressLine2Raw } : {}),
    ...(notesRaw ? { notes: notesRaw } : {}),
  }

  return {
    ok: true,
    data: {
      customer,
      items,
      paymentMethod: "cod",
    },
  }
}

export function computeSubtotal(items: CartLineItem[]): number {
  return items.reduce((sum, line) => sum + line.price * line.quantity, 0)
}
