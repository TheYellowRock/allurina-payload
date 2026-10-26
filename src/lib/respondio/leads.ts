/**
 * Checkout leads — step 1 of the checkout (name + phone) pushed to respond.io as a hot
 * lead, before the customer has given an address or placed the order.
 *
 *   recordLead(payload, lead)            → stores the lead row (called by /api/store/lead)
 *   syncLeadToRespondIo(payload, key)    → contact upsert + `lead-checkout` tag (in after())
 *   markLeadsConverted(payload, phone, ref) → order placed: row → converted, tag removed
 *
 * respond.io side (configured there, not here): a Workflow triggered on `lead-checkout`
 * being added waits N minutes, then messages the contact only if the tag is still there.
 * The site removes the tag the moment an order is placed with that phone.
 *
 * Race guard: the lead sync adds the tag and THEN re-reads the row; the conversion writes
 * the row and THEN removes the tag. Whatever the interleaving, the last step to run sees
 * the other's effect, so a converted customer never keeps the tag.
 *
 * Same guarantees as ./sync: never throws, no Payload collection touched (state lives in
 * `integrations.checkout_leads`, see scripts/checkout-leads.sql), every network call goes
 * through `resolveSyncMode()`. If the SQL hasn't been run yet, everything degrades to a
 * logged no-op and the checkout keeps working.
 *
 * Imports are relative (not `@/…`) so scripts can load this file.
 */
import { sql } from "@payloadcms/db-postgres"
import type { Payload } from "payload"

import { addContactTags, createOrUpdateContact, removeContactTags } from "./client"
import {
  RESPONDIO_FIELDS,
  RESPONDIO_TAGS,
  isLeadSyncEnabled,
  maskPhone,
  resolveSyncMode,
} from "./config"
import { formatItems } from "./sync"

const LOG = "[respondio:lead]"
/** Leads from one IP over the last hour beyond which we stop pushing to respond.io (bots, abuse). */
const MAX_LEADS_PER_IP_PER_HOUR = 6
/** An order converts the leads of that phone created within this window. */
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

function splitName(fullName: string): { firstName: string; lastName: string | null } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: "Client", lastName: null }
  return { firstName: parts[0], lastName: parts.length > 1 ? parts.slice(1).join(" ") : null }
}

/**
 * Upserts the lead row (same `leadKey` = same checkout session: the customer went back
 * and corrected their name or phone). Returns false when the row couldn't be written —
 * typically because scripts/checkout-leads.sql hasn't been run.
 */
export async function recordLead(payload: Payload, lead: LeadInput): Promise<boolean> {
  try {
    await query(
      payload,
      sql`INSERT INTO integrations.checkout_leads
            (lead_key, phone_e164, customer_name, items, cart_total, ip_hash)
          VALUES (${lead.leadKey}::uuid, ${lead.phoneE164}, ${lead.customerName},
                  ${JSON.stringify(lead.items)}::jsonb, ${lead.cartTotal}, ${lead.ipHash})
          ON CONFLICT (lead_key) DO UPDATE
             SET phone_e164       = EXCLUDED.phone_e164,
                 customer_name    = EXCLUDED.customer_name,
                 items            = EXCLUDED.items,
                 cart_total       = EXCLUDED.cart_total,
                 respondio_status = CASE WHEN integrations.checkout_leads.status = 'new'
                                         THEN 'pending' ELSE integrations.checkout_leads.respondio_status END`,
    )
    return true
  } catch (err) {
    console.error(LOG, "could not record lead (has scripts/checkout-leads.sql been run?)", {
      error: err instanceof Error ? err.message : String(err),
    })
    return false
  }
}

async function setSyncResult(
  payload: Payload,
  leadKey: string,
  result: { status: string; error?: string | null; contactId?: number | null; env?: string | null },
): Promise<void> {
  await query(
    payload,
    sql`UPDATE integrations.checkout_leads
           SET respondio_status = ${result.status}::text,
               respondio_error  = ${result.error ?? null}::text,
               contact_id       = COALESCE(${result.contactId ?? null}::bigint, contact_id),
               env              = COALESCE(${result.env ?? null}::text, env)
         WHERE lead_key = ${leadKey}::uuid`,
  )
}

export type LeadSyncOutcome =
  | { status: "synced"; contactId: number | null }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string }

export async function syncLeadToRespondIo(payload: Payload, leadKey: string): Promise<LeadSyncOutcome> {
  try {
    const rows = await query(
      payload,
      sql`SELECT phone_e164, customer_name, items, cart_total, ip_hash, status
            FROM integrations.checkout_leads WHERE lead_key = ${leadKey}::uuid`,
    )
    const row = rows[0]
    if (!row) return { status: "skipped", reason: "no_row" }
    if (row.status !== "new") return { status: "skipped", reason: "already_converted" }

    const phone = String(row.phone_e164)

    if (!isLeadSyncEnabled()) {
      await setSyncResult(payload, leadKey, { status: "skipped", error: "disabled" })
      return { status: "skipped", reason: "disabled" }
    }
    const mode = resolveSyncMode(phone)
    if (!mode.allowed) {
      await setSyncResult(payload, leadKey, { status: "skipped", error: mode.reason })
      return { status: "skipped", reason: mode.reason }
    }

    // Anyone can type any number: cap what one visitor can push, so the endpoint can't
    // be used to make the shop message strangers.
    if (row.ip_hash) {
      const recent = await query(
        payload,
        sql`SELECT count(*)::int AS n FROM integrations.checkout_leads
             WHERE ip_hash = ${String(row.ip_hash)}
               AND created_at > now() - interval '1 hour'`,
      )
      if (Number(recent[0]?.n) > MAX_LEADS_PER_IP_PER_HOUR) {
        await setSyncResult(payload, leadKey, { status: "rate_limited" })
        console.warn(LOG, "rate limited", { phone: maskPhone(phone) })
        return { status: "skipped", reason: "rate_limited" }
      }
    }

    const identifier = `phone:${phone}` as const
    const items = (Array.isArray(row.items) ? row.items : []) as LeadItem[]
    const { firstName, lastName } = splitName(String(row.customer_name))

    // 1. Contact + cart fields. The `lastOrder*` fields are left alone: they describe the
    //    customer's last real order and the confirmation Workflow reads them.
    const contactRes = await createOrUpdateContact(identifier, {
      firstName,
      lastName,
      phone,
      countryCode: "MA",
      custom_fields: [
        { name: RESPONDIO_FIELDS.cartItems, value: formatItems(items) },
        { name: RESPONDIO_FIELDS.cartTotal, value: Math.round(Number(row.cart_total ?? 0) * 100) / 100 },
        { name: RESPONDIO_FIELDS.env, value: mode.env },
      ],
    })
    if (!contactRes.ok) {
      const error = `contact upsert ${contactRes.status}: ${contactRes.error}`
      await setSyncResult(payload, leadKey, { status: "failed", error, env: mode.env })
      console.error(LOG, "failed", { error, phone: maskPhone(phone) })
      return { status: "failed", error }
    }
    const contactId = typeof contactRes.data?.contactId === "number" ? contactRes.data.contactId : null

    // 2. Tag — fires the respond.io Workflow.
    const tags: string[] = [RESPONDIO_TAGS.checkoutLead]
    if (mode.env === "test") tags.push(RESPONDIO_TAGS.test)
    const tagRes = await addContactTags(identifier, tags)
    if (!tagRes.ok) {
      const error = `contact ok, tags ${tagRes.status}: ${tagRes.error}`
      await setSyncResult(payload, leadKey, { status: "failed", error, contactId, env: mode.env })
      console.error(LOG, "failed", { error, phone: maskPhone(phone) })
      return { status: "failed", error }
    }

    // 3. Race guard: the order may have been placed while we were talking to respond.io.
    const after = await query(
      payload,
      sql`SELECT status FROM integrations.checkout_leads WHERE lead_key = ${leadKey}::uuid`,
    )
    if (after[0]?.status === "converted") {
      await removeContactTags(identifier, [RESPONDIO_TAGS.checkoutLead])
    }

    await setSyncResult(payload, leadKey, { status: "synced", contactId, env: mode.env })
    console.info(LOG, "synced", { contactId, env: mode.env, phone: maskPhone(phone) })
    return { status: "synced", contactId }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.error(LOG, "unexpected error", { error })
    try {
      await setSyncResult(payload, leadKey, { status: "failed", error: `unexpected: ${error}` })
    } catch {
      // Table missing — already logged.
    }
    return { status: "failed", error }
  }
}

/**
 * Order placed: every open lead of that phone (last 7 days) becomes `converted`, and the
 * `lead-checkout` tag is removed so the abandoned-cart Workflow stops for this contact.
 */
export async function markLeadsConverted(
  payload: Payload,
  phoneE164: string | null,
  orderReference: string,
): Promise<void> {
  if (!phoneE164) return
  try {
    const converted = await query(
      payload,
      sql`UPDATE integrations.checkout_leads
             SET status = 'converted', order_reference = ${orderReference}, converted_at = now()
           WHERE phone_e164 = ${phoneE164}
             AND status = 'new'
             AND created_at > now() - ${CONVERSION_WINDOW}::interval
       RETURNING respondio_status`,
    )
    if (converted.length === 0) return
    // Only contacts we may have tagged. A row still `pending` counts: its sync may be
    // in flight right now (the race guard in syncLeadToRespondIo covers the rest).
    const mayBeTagged = converted.some((r) => r.respondio_status === "synced" || r.respondio_status === "pending")
    if (!mayBeTagged || !isLeadSyncEnabled() || !resolveSyncMode(phoneE164).allowed) return

    const res = await removeContactTags(`phone:${phoneE164}`, [RESPONDIO_TAGS.checkoutLead])
    if (!res.ok) {
      console.error(LOG, "could not remove lead tag after order", {
        orderReference,
        status: res.status,
        error: res.error,
      })
    }
  } catch (err) {
    console.error(LOG, "markLeadsConverted failed", {
      orderReference,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
