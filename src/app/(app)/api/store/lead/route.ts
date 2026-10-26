import { createHash } from "node:crypto"

import { NextResponse, after } from "next/server"
import { getPayload } from "payload"

import config from "@payload-config"
import { resolveLines } from "@/lib/catalog/resolve-lines"
import { toMoroccanE164 } from "@/lib/respondio/config"
import { recordLead, syncLeadToRespondIo, type LeadItem } from "@/lib/respondio/leads"

export const dynamic = "force-dynamic"

/**
 * Checkout step 1 (name + phone) → hot lead.
 *
 * Body: { leadKey: uuid, customerName, phone, items: [{ productId, variantId?, quantity }] }
 *
 * The cart is re-resolved from the database (titles, prices) — nothing the browser says
 * about prices is stored. The respond.io push runs in `after()`, so the customer moves
 * on to step 2 immediately. Any failure past validation still answers 200: the lead is
 * a bonus, it must never block the checkout.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_LINES = 30

function clientIpHash(req: Request): string | null {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim() || ""
  if (!ip) return null
  return createHash("sha256")
    .update(`${ip}|${process.env.PAYLOAD_SECRET ?? ""}`)
    .digest("hex")
    .slice(0, 32)
}

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 })
  }

  const leadKey = typeof body.leadKey === "string" ? body.leadKey : ""
  const customerName = typeof body.customerName === "string" ? body.customerName.trim().slice(0, 200) : ""
  const phoneE164 = toMoroccanE164(typeof body.phone === "string" ? body.phone : null)

  if (!UUID_RE.test(leadKey)) return NextResponse.json({ error: "Requête invalide." }, { status: 400 })
  if (customerName.length < 2) return NextResponse.json({ error: "Indiquez votre nom." }, { status: 400 })
  if (!phoneE164) {
    return NextResponse.json({ error: "Numéro de téléphone invalide (ex : 06 12 34 56 78)." }, { status: 400 })
  }

  const rawItems = Array.isArray(body.items) ? body.items.slice(0, MAX_LINES) : []
  const refs = rawItems
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object")
    .map((x) => ({
      productId: String(x.productId ?? ""),
      variantId: typeof x.variantId === "string" && x.variantId ? x.variantId : null,
      quantity: Math.max(1, Math.min(99, Math.floor(Number(x.quantity) || 1))),
    }))
    .filter((r) => /^\d+$/.test(r.productId))

  try {
    const payload = await getPayload({ config: await config })
    const resolved = refs.length ? await resolveLines(payload, refs) : []
    const items: LeadItem[] = resolved.flatMap((line, i) =>
      line.exists && line.title && line.price !== null
        ? [{ title: line.title, variantLabel: line.variantLabel, quantity: refs[i]!.quantity, price: line.price }]
        : [],
    )
    const cartTotal = items.reduce((sum, l) => sum + l.price * l.quantity, 0)

    const stored = await recordLead(payload, {
      leadKey,
      customerName,
      phoneE164,
      items,
      cartTotal,
      ipHash: clientIpHash(req),
    })
    if (stored) after(() => syncLeadToRespondIo(payload, leadKey))
  } catch (err) {
    console.error("[store/lead]", err instanceof Error ? err.message : err)
  }

  return NextResponse.json({ ok: true })
}
