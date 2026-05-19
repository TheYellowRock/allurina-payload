import { createElement } from "react"
import { Resend } from "resend"

import OrderConfirmation from "@/emails/OrderConfirmation"
import OwnerNotification from "@/emails/OwnerNotification"
import type { OrderEmailLine, OrderEmailProps } from "@/lib/order-email-types"

/** Payload `orders` document shape used for transactional email mapping. */
export type OrderDocForEmail = {
  orderReference: string
  customerName: string
  email: string
  phone: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  postalCode: string
  country: string
  notes?: string | null
  paymentMethod: string
  status: string
  items: unknown
  subtotal: number
  volumeDiscount: number
  deliveryFee: number
  grandTotal: number
}

const resendClient = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

function asOrderRecord(order: unknown): Record<string, unknown> {
  if (!order || typeof order !== "object") return {}
  return order as Record<string, unknown>
}

function readStr(v: unknown): string {
  return typeof v === "string" ? v : v != null ? String(v) : ""
}

function readNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function readOptionalStr(v: unknown): string | null {
  if (v == null) return null
  if (typeof v !== "string") return null
  const t = v.trim()
  return t.length > 0 ? t : null
}

/**
 * HTTPS origin for images in emails (logo + relative `imageSrc`).
 * Prefer `EMAIL_PUBLIC_BASE_URL` when `NEXT_PUBLIC_SERVER_URL` is localhost — many clients block those images.
 */
function normalizeEmailPublicBase(): string | null {
  const explicit = process.env.EMAIL_PUBLIC_BASE_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, "")

  const next = process.env.NEXT_PUBLIC_SERVER_URL?.trim()
  if (next) return next.replace(/\/$/, "")

  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "").replace(/\/$/, "")
    return `https://${host}`
  }

  return null
}

/** Email clients need absolute `https://` URLs for images. */
function toAbsoluteMediaUrl(publicBase: string | null, src: string | null): string | null {
  if (!src) return null
  const s = src.trim()
  if (!s) return null
  if (s.startsWith("http://") || s.startsWith("https://")) return s
  if (!publicBase) return null
  const path = s.startsWith("/") ? s : `/${s}`
  return `${publicBase}${path}`
}

function parseItemsJson(raw: unknown, publicBase: string | null): OrderEmailLine[] {
  if (!Array.isArray(raw)) return []
  const out: OrderEmailLine[] = []
  for (const x of raw) {
    if (!x || typeof x !== "object") continue
    const o = x as Record<string, unknown>
    const title = readStr(o.title)
    const quantity = Math.max(0, Math.floor(readNum(o.quantity)))
    const unitPriceDh = Math.max(0, readNum(o.price))
    if (!title || quantity < 1) continue
    const rawImg =
      o.imageSrc === null
        ? null
        : typeof o.imageSrc === "string"
          ? o.imageSrc.trim() || null
          : null
    out.push({
      title,
      quantity,
      unitPriceDh,
      lineTotalDh: unitPriceDh * quantity,
      imageSrc: toAbsoluteMediaUrl(publicBase, rawImg),
    })
  }
  return out
}

/**
 * Maps a Payload `orders` document to props for React Email templates
 * (field names match `src/collections/Orders.ts`).
 */
export function formatOrder(order: unknown): OrderEmailProps {
  const o = asOrderRecord(order)
  const publicBase = normalizeEmailPublicBase()
  const lines = parseItemsJson(o.items, publicBase)
  const logoUrl = publicBase ? `${publicBase}/allurina-scarf-logo.png` : null

  return {
    logoUrl,
    orderReference: readStr(o.orderReference),
    customerName: readStr(o.customerName),
    email: readStr(o.email),
    phone: readStr(o.phone),
    addressLine1: readStr(o.addressLine1),
    addressLine2: readOptionalStr(o.addressLine2),
    city: readStr(o.city),
    postalCode: readStr(o.postalCode),
    country: readStr(o.country),
    notes: readOptionalStr(o.notes),
    paymentMethod: readStr(o.paymentMethod),
    status: readStr(o.status),
    lines: lines.length > 0 ? lines : [],
    subtotalDh: readNum(o.subtotal),
    volumeDiscountDh: readNum(o.volumeDiscount),
    volumeRemiseLineDh: 0,
    deliveryFeeDh: readNum(o.deliveryFee),
    grandTotalDh: readNum(o.grandTotal),
  }
}

export async function sendOrderConfirmation(order: unknown): Promise<void> {
  try {
    const from = process.env.FROM_EMAIL
    if (!resendClient || !from) {
      console.warn("[email] sendOrderConfirmation skipped: RESEND_API_KEY or FROM_EMAIL missing.")
      return
    }
    const props = formatOrder(order)
    if (!props.email) {
      console.warn("[email] sendOrderConfirmation skipped: order has no customer email.")
      return
    }
    const { data, error } = await resendClient.emails.send({
      from,
      to: props.email,
      subject: `Allurina — Commande ${props.orderReference}`,
      react: createElement(OrderConfirmation, props),
    })
    if (error) {
      console.error("[email] sendOrderConfirmation Resend error:", error)
      return
    }
    if (!data?.id) {
      console.warn("[email] sendOrderConfirmation: unexpected empty response from Resend.")
    }
  } catch (err) {
    console.error("[email] sendOrderConfirmation", err)
  }
}

export async function sendOwnerNotification(order: unknown): Promise<void> {
  try {
    const from = process.env.FROM_EMAIL
    const owner = process.env.OWNER_EMAIL
    if (!resendClient || !from || !owner) {
      console.warn(
        "[email] sendOwnerNotification skipped: RESEND_API_KEY, FROM_EMAIL, or OWNER_EMAIL missing.",
      )
      return
    }
    const props = formatOrder(order)
    const { data, error } = await resendClient.emails.send({
      from,
      to: owner,
      subject: `[Allurina] Nouvelle commande ${props.orderReference}`,
      react: createElement(OwnerNotification, props),
    })
    if (error) {
      console.error("[email] sendOwnerNotification Resend error:", error)
      return
    }
    if (!data?.id) {
      console.warn("[email] sendOwnerNotification: unexpected empty response from Resend.")
    }
  } catch (err) {
    console.error("[email] sendOwnerNotification", err)
  }
}
