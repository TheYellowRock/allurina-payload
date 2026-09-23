/**
 * respond.io outbound order sync — the only entry point the rest of the app uses.
 *
 *   syncOrderToRespondIo(payload, order)
 *
 * Upserts the customer as a respond.io contact keyed on `phone:+212…`, writes the order
 * into custom fields, THEN adds tags. The order matters: adding `cod-a-confirmer` is what
 * triggers the respond.io Workflow, so the tag must never land before the fields the
 * Workflow's template reads — or the customer gets a message about an empty order.
 *
 * Guarantees:
 * - Never throws, never rejects. The caller has nothing useful to do with an error.
 * - Idempotent per order: the unique constraint on `integrations.respondio_sync.order_id`
 *   is the lock (INSERT … ON CONFLICT DO NOTHING). A second call for the same order is a
 *   no-op, even if two run concurrently.
 * - Goes through `resolveSyncMode()` before any network call (see ./config).
 * - Touches no Payload collection and no `public` table except a read-only count on
 *   `orders`. State lives only in `integrations.respondio_sync` — see
 *   scripts/respondio-sync.sql for why it's in its own schema.
 *
 * Imports are relative (not `@/…`) so the jiti scripts in /scripts can load this file.
 */
import { sql } from "@payloadcms/db-postgres"
import type { Payload } from "payload"

import { addContactTags, createOrUpdateContact, type RespondIoContactFields } from "./client"
import {
  INITIAL_COD_STATUS,
  RESPONDIO_FIELDS,
  RESPONDIO_TAGS,
  isRespondIoEnabled,
  maskPhone,
  resolveSyncMode,
  toMoroccanE164,
} from "./config"

/** What the sync needs from an order — built from typed checkout data, not a raw doc. */
export type RespondIoOrderInput = {
  orderReference: string
  customerName: string
  email?: string | null
  phone: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  grandTotal: number
  items: ReadonlyArray<{ title: string; quantity: number }>
}

export type SyncOutcome =
  | { status: "synced"; contactId: number | null; env: "production" | "test" }
  | { status: "skipped"; reason: "disabled" | "non_prod_not_allowlisted" }
  | { status: "duplicate" }
  | { status: "invalid_phone" }
  | { status: "failed"; error: string }

export type SyncOptions = {
  /** Re-claim a row currently in `failed` instead of inserting a new one (retry script). */
  retry?: boolean
}

const MAX_ITEMS_TEXT = 200
const LOG = "[respondio]"

type Row = Record<string, unknown>

/**
 * `payload.db.execute` is the raw drizzle helper: it runs against whichever handle it's
 * given (`db ?? drizzle`) and has no default — so pass the pool-backed instance
 * explicitly. Deliberately NOT the checkout transaction: this runs after it committed.
 */
async function query(payload: Payload, statement: ReturnType<typeof sql>): Promise<Row[]> {
  const result = await payload.db.execute({ drizzle: payload.db.drizzle, sql: statement })
  return (result?.rows ?? []) as Row[]
}

// ---------------------------------------------------------------------------
// Payload building
// ---------------------------------------------------------------------------

function splitName(fullName: string): { firstName: string; lastName: string | null } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: "Client", lastName: null }
  return { firstName: parts[0], lastName: parts.length > 1 ? parts.slice(1).join(" ") : null }
}

/**
 * "3x Signature bleu, 2x Signature crème" — read by a human agent and by template vars.
 * Plain ASCII separators: respond.io rejects emojis and special characters in contact
 * field values. Accented letters from product titles are ordinary text and kept.
 */
export function formatItems(items: RespondIoOrderInput["items"]): string {
  const text = items
    .filter((line) => line && typeof line.title === "string" && line.quantity > 0)
    .map((line) => `${line.quantity}x ${line.title.trim()}`)
    .join(", ")
  return text.length > MAX_ITEMS_TEXT ? `${text.slice(0, MAX_ITEMS_TEXT - 3).trimEnd()}...` : text
}

export function buildContactFields(
  order: RespondIoOrderInput,
  phoneE164: string,
  ordersCount: number,
  env: "production" | "test",
): RespondIoContactFields {
  const { firstName, lastName } = splitName(order.customerName)
  const address = [order.addressLine1, order.addressLine2].filter((s) => s && s.trim()).join(", ")
  const email = order.email?.trim().toLowerCase() || null

  return {
    firstName,
    lastName,
    phone: phoneE164,
    email,
    countryCode: "MA",
    custom_fields: [
      { name: RESPONDIO_FIELDS.lastOrderId, value: order.orderReference },
      { name: RESPONDIO_FIELDS.lastOrderTotal, value: Math.round(order.grandTotal * 100) / 100 },
      { name: RESPONDIO_FIELDS.lastOrderItems, value: formatItems(order.items) },
      { name: RESPONDIO_FIELDS.city, value: order.city.trim() },
      { name: RESPONDIO_FIELDS.address, value: address },
      { name: RESPONDIO_FIELDS.codStatus, value: INITIAL_COD_STATUS },
      { name: RESPONDIO_FIELDS.ordersCount, value: ordersCount },
      { name: RESPONDIO_FIELDS.source, value: "site" },
      { name: RESPONDIO_FIELDS.env, value: env },
    ],
  }
}

export function buildTags(ordersCount: number, env: "production" | "test"): string[] {
  const tags: string[] = [RESPONDIO_TAGS.toConfirm]
  if (ordersCount > 1) tags.push(RESPONDIO_TAGS.repeatCustomer)
  if (env === "test") tags.push(RESPONDIO_TAGS.test)
  return tags
}

// ---------------------------------------------------------------------------
// Sidecar table
// ---------------------------------------------------------------------------

/**
 * Non-cancelled orders for this phone, this one included. Matched on the last 9 digits
 * because `orders.phone` is stored exactly as the customer typed it.
 */
async function countOrdersForPhone(payload: Payload, phoneE164: string): Promise<number> {
  const nine = phoneE164.slice(-9)
  const rows = await query(
    payload,
    sql`SELECT count(*)::int AS n
          FROM "orders"
         WHERE right(regexp_replace("phone", '[^0-9]', '', 'g'), 9) = ${nine}
           AND "status" <> 'cancelled'`,
  )
  const n = Number(rows[0]?.n)
  return Number.isFinite(n) && n > 0 ? n : 1
}

/** Returns true when THIS call owns the order (the idempotency lock). */
async function claim(
  payload: Payload,
  orderId: string,
  phoneE164: string,
  env: "production" | "test",
  retry: boolean,
): Promise<boolean> {
  const rows = retry
    ? await query(
        payload,
        sql`UPDATE integrations.respondio_sync
               SET sync_status = 'pending', sync_error = NULL
             WHERE order_id = ${orderId} AND sync_status = 'failed'
         RETURNING id`,
      )
    : await query(
        payload,
        sql`INSERT INTO integrations.respondio_sync (order_id, phone_e164, env, sync_status)
            VALUES (${orderId}, ${phoneE164}, ${env}, 'pending')
            ON CONFLICT (order_id) DO NOTHING
         RETURNING id`,
      )
  return rows.length > 0
}

async function finish(
  payload: Payload,
  orderId: string,
  result: { status: "synced" | "failed"; contactId: number | null; error: string | null },
): Promise<void> {
  await query(
    payload,
    sql`UPDATE integrations.respondio_sync
           SET sync_status = ${result.status}::text,
               contact_id  = COALESCE(${result.contactId}::bigint, contact_id),
               sync_error  = ${result.error}::text,
               attempts    = attempts + 1,
               synced_at   = CASE WHEN ${result.status}::text = 'synced' THEN now() ELSE synced_at END
         WHERE order_id = ${orderId}`,
  )
}

async function recordInvalidPhone(payload: Payload, orderId: string, rawPhone: string): Promise<void> {
  await query(
    payload,
    sql`INSERT INTO integrations.respondio_sync (order_id, phone_e164, sync_status, sync_error)
        VALUES (${orderId}, ${rawPhone.slice(0, 40)}, 'invalid_phone', 'could not normalize to +212XXXXXXXXX')
        ON CONFLICT (order_id) DO NOTHING`,
  )
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export async function syncOrderToRespondIo(
  payload: Payload,
  order: RespondIoOrderInput,
  options: SyncOptions = {},
): Promise<SyncOutcome> {
  const orderId = order.orderReference

  try {
    // Feature off → no DB write, no network. Deploying the code before running the SQL
    // is therefore safe as long as RESPONDIO_ENABLED stays unset.
    if (!isRespondIoEnabled()) return { status: "skipped", reason: "disabled" }

    const phone = toMoroccanE164(order.phone)
    if (!phone) {
      // Only recorded for production orders — a dev typo isn't worth a row.
      if (process.env.VERCEL_ENV === "production") await recordInvalidPhone(payload, orderId, order.phone)
      console.warn(LOG, "invalid phone, not synced", { orderId })
      return { status: "invalid_phone" }
    }

    const mode = resolveSyncMode(phone)
    if (!mode.allowed) {
      console.info(LOG, "skipped", { orderId, reason: mode.reason, phone: maskPhone(phone) })
      return { status: "skipped", reason: mode.reason }
    }

    if (!(await claim(payload, orderId, phone, mode.env, options.retry === true))) {
      return { status: "duplicate" }
    }

    const identifier = `phone:${phone}` as const
    const ordersCount = await countOrdersForPhone(payload, phone)
    const fields = buildContactFields(order, phone, ordersCount, mode.env)

    // 1. Contact + custom fields.
    let contactRes = await createOrUpdateContact(identifier, fields)

    // An email already attached to a different respond.io contact can reject the upsert.
    // The phone is the identity that matters for WhatsApp — retry once without the email.
    if (!contactRes.ok && fields.email && contactRes.status >= 400 && contactRes.status < 500 && contactRes.status !== 429) {
      console.warn(LOG, "upsert rejected with email, retrying without it", {
        orderId,
        status: contactRes.status,
        error: contactRes.error,
      })
      contactRes = await createOrUpdateContact(identifier, { ...fields, email: null })
    }

    if (!contactRes.ok) {
      const error = `contact upsert ${contactRes.status}: ${contactRes.error}`
      await finish(payload, orderId, { status: "failed", contactId: null, error })
      console.error(LOG, "failed", { orderId, error })
      return { status: "failed", error }
    }

    const contactId = typeof contactRes.data?.contactId === "number" ? contactRes.data.contactId : null

    // 2. Tags — strictly after the fields are in place (this is what fires the Workflow).
    const tagRes = await addContactTags(identifier, buildTags(ordersCount, mode.env))
    if (!tagRes.ok) {
      const error = `contact ok, tags ${tagRes.status}: ${tagRes.error}`
      await finish(payload, orderId, { status: "failed", contactId, error })
      console.error(LOG, "failed", { orderId, error })
      return { status: "failed", error }
    }

    await finish(payload, orderId, { status: "synced", contactId, error: null })
    console.info(LOG, "synced", { orderId, contactId, env: mode.env, ordersCount, phone: maskPhone(phone) })
    return { status: "synced", contactId, env: mode.env }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.error(LOG, "unexpected error", { orderId, error })
    try {
      await finish(payload, orderId, { status: "failed", contactId: null, error: `unexpected: ${error}` })
    } catch {
      // The sidecar table itself may be the problem (e.g. SQL not run yet). Logged above.
    }
    return { status: "failed", error }
  }
}

/** Rebuilds the sync input from a stored `orders` doc — used by the retry script. */
export function respondIoOrderFromDoc(doc: Record<string, unknown>): RespondIoOrderInput | null {
  const str = (v: unknown) => (typeof v === "string" ? v : "")
  const orderReference = str(doc.orderReference)
  if (!orderReference) return null
  const rawItems = Array.isArray(doc.items) ? doc.items : []
  return {
    orderReference,
    customerName: str(doc.customerName),
    email: str(doc.email) || null,
    phone: str(doc.phone),
    addressLine1: str(doc.addressLine1),
    addressLine2: str(doc.addressLine2) || null,
    city: str(doc.city),
    grandTotal: Number(doc.grandTotal) || 0,
    items: rawItems
      .filter((l): l is Record<string, unknown> => Boolean(l) && typeof l === "object")
      .map((l) => ({ title: str(l.title), quantity: Number(l.quantity) || 0 })),
  }
}
