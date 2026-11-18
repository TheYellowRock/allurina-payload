/**
 * Checkout leads — step 1 of the checkout (name + phone), recorded before the customer
 * has given an address or placed the order, so a drop-off at step 2 is still visible to
 * staff for manual follow-up (call/WhatsApp) instead of being lost entirely.
 *
 *   recordLead(payload, lead)                     → stores the lead row (called by /api/store/lead)
 *   markLeadsConverted(payload, phone, ref)        → order placed: row → converted
 *   listOpenLeads(payload)                         → "paniers abandonnés" studio page
 *
 * State lives in `integrations.checkout_leads` (see scripts/checkout-leads.sql) — the
 * same table the old respond.io integration wrote to. Its respondio_status/contact_id/env
 * columns are dead weight now (left alone — schema changes are manual) and simply unused.
 *
 * Never throws: a failure here must never block checkout. If the SQL hasn't been run,
 * everything degrades to a logged no-op.
 *
 * Imports are relative (not `@/…`) so the jiti scripts in /scripts can load this file.
 */
import { sql } from "@payloadcms/db-postgres"
import type { Payload } from "payload"

const LOG = "[leads]"
/** Leads from one IP over the last hour beyond which we stop recording (bots, abuse). */
const MAX_LEADS_PER_IP_PER_HOUR = 6
/** An order converts the open leads of that phone created within this window. */
const CONVERSION_WINDOW = "7 days"

type Row = Record<string, unknown>

async function query(payload: Payload, statement: ReturnType<typeof sql>): Promise<Row[]> {
  const result = await payload.db.execute({ drizzle: payload.db.drizzle, sql: statement })
  return (result?.rows ?? []) as Row[]
}

export type LeadItem = { title: string; variantLabel?: string | null; quantity: number; price: number }

export type LeadInput = {
  leadKey: string
  customerName: string
  /** Already normalized to +212XXXXXXXXX by the caller. */
  phoneE164: string
  items: LeadItem[]
  cartTotal: number
  ipHash: string | null
}

export type OpenLead = {
  leadKey: string
  customerName: string
  phoneE164: string
  items: LeadItem[]
  cartTotal: number
  createdAt: string
}

/**
 * Upserts the lead row (same `leadKey` = same checkout session: the customer went back
 * and corrected their name or phone). Returns false when the row couldn't be written —
 * typically because scripts/checkout-leads.sql hasn't been run, or the IP rate limit hit.
 */
export async function recordLead(payload: Payload, lead: LeadInput): Promise<boolean> {
  try {
    if (lead.ipHash) {
      const recent = await query(
        payload,
        sql`SELECT count(*)::int AS n FROM integrations.checkout_leads
             WHERE ip_hash = ${lead.ipHash} AND created_at > now() - interval '1 hour'`,
      )
      if (Number(recent[0]?.n) > MAX_LEADS_PER_IP_PER_HOUR) {
        console.warn(LOG, "rate limited")
        return false
      }
    }

    await query(
      payload,
      sql`INSERT INTO integrations.checkout_leads
            (lead_key, phone_e164, customer_name, items, cart_total, ip_hash)
          VALUES (${lead.leadKey}::uuid, ${lead.phoneE164}, ${lead.customerName},
                  ${JSON.stringify(lead.items)}::jsonb, ${lead.cartTotal}, ${lead.ipHash})
          ON CONFLICT (lead_key) DO UPDATE
             SET phone_e164    = EXCLUDED.phone_e164,
                 customer_name = EXCLUDED.customer_name,
                 items         = EXCLUDED.items,
                 cart_total    = EXCLUDED.cart_total`,
    )
    return true
  } catch (err) {
    console.error(LOG, "could not record lead (has scripts/checkout-leads.sql been run?)", {
      error: err instanceof Error ? err.message : String(err),
    })
    return false
  }
}

/** Order placed: every open lead of that phone (last 7 days) becomes `converted`. */
export async function markLeadsConverted(
  payload: Payload,
  phoneE164: string | null,
  orderReference: string,
): Promise<void> {
  if (!phoneE164) return
  try {
    await query(
      payload,
      sql`UPDATE integrations.checkout_leads
             SET status = 'converted', order_reference = ${orderReference}, converted_at = now()
           WHERE phone_e164 = ${phoneE164}
             AND status = 'new'
             AND created_at > now() - ${CONVERSION_WINDOW}::interval`,
    )
  } catch (err) {
    console.error(LOG, "markLeadsConverted failed", {
      orderReference,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

/** Leads still `new` — dropped at step 1/2, never placed an order. For the "paniers abandonnés" studio page. */
export async function listOpenLeads(payload: Payload, limit = 300): Promise<OpenLead[]> {
  try {
    const rows = await query(
      payload,
      sql`SELECT lead_key, customer_name, phone_e164, items, cart_total, created_at
            FROM integrations.checkout_leads
           WHERE status = 'new'
           ORDER BY created_at DESC
           LIMIT ${limit}`,
    )
    return rows.map((r) => ({
      leadKey: String(r.lead_key),
      customerName: String(r.customer_name),
      phoneE164: String(r.phone_e164),
      items: (Array.isArray(r.items) ? r.items : []) as LeadItem[],
      cartTotal: Number(r.cart_total ?? 0),
      createdAt: new Date(String(r.created_at)).toISOString(),
    }))
  } catch (err) {
    console.error(LOG, "listOpenLeads failed", { error: err instanceof Error ? err.message : String(err) })
    return []
  }
}
