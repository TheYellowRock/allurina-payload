/**
 * respond.io integration — environment guard, phone normalization, and the fixed
 * vocabulary (custom-field names + tags) shared with the respond.io workspace.
 *
 * Pure module: no I/O, no Payload, no Next imports. Safe to import from scripts.
 *
 * The site's ONLY job is outbound: push each new order into respond.io as a contact
 * (custom fields first, then tags). All messaging — templates, confirmation buttons,
 * follow-ups — is configured in the respond.io platform, never here.
 */

/**
 * Custom-field IDs written on the respond.io contact — camelCase, matching respond.io's
 * built-in fields (firstName, countryCode, profilePic). Each must exist in the workspace
 * (Settings → Workspace Settings → Contact Fields) with BOTH its Name and its Field ID
 * set to exactly this string, so the sync works whichever of the two the API matches on.
 * The Field ID can't be changed after creation; `scripts/respondio-smoke.ts` reads every
 * field back and names any that are missing.
 */
export const RESPONDIO_FIELDS = {
  lastOrderId: "lastOrderId",
  lastOrderTotal: "lastOrderTotal",
  lastOrderItems: "lastOrderItems",
  city: "city",
  address: "address",
  codStatus: "codStatus",
  ordersCount: "ordersCount",
  source: "source",
  env: "env",
} as const

/**
 * The only tags the site ever sets. `toConfirm` is the contract with respond.io: a
 * Workflow triggers on it being added. Everything else (cod-confirmee, …) is applied by
 * Workflows inside respond.io, never by code.
 */
export const RESPONDIO_TAGS = {
  toConfirm: "cod-a-confirmer",
  repeatCustomer: "client-recurrent",
  test: "test-ignore",
} as const

/** Written once per new order. After that, `codStatus` belongs to respond.io Workflows. */
export const INITIAL_COD_STATUS = "en_attente"

type Env = Record<string, string | undefined>

/**
 * Morocco → E.164. Strip non-digits → strip leading zeros → strip a leading `212` →
 * strip remaining leading zeros → require exactly 9 digits → prepend `+212`.
 *
 *   "0612345678"         → "+212612345678"
 *   "+212 6 12 34 56 78" → "+212612345678"
 *   "00212612345678"     → "+212612345678"
 *   "+212 0612345678"    → "+212612345678"
 *   "612345678"          → "+212612345678"
 *   "06123"              → null
 */
export function toMoroccanE164(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null
  let digits = raw.replace(/\D/g, "")
  digits = digits.replace(/^0+/, "")
  if (digits.startsWith("212")) digits = digits.slice(3)
  digits = digits.replace(/^0+/, "")
  if (!/^\d{9}$/.test(digits)) return null
  return `+212${digits}`
}

/** `RESPONDIO_TEST_PHONES` — comma-separated, any format; normalized, invalid entries dropped. */
export function parseTestPhones(csv: string | undefined): Set<string> {
  const out = new Set<string>()
  for (const part of (csv ?? "").split(",")) {
    const e164 = toMoroccanE164(part)
    if (e164) out.add(e164)
  }
  return out
}

export function isRespondIoEnabled(env: Env = process.env): boolean {
  return env.RESPONDIO_ENABLED === "true" && Boolean(env.RESPONDIO_API_TOKEN)
}

export type SyncMode =
  | { allowed: true; env: "production" | "test" }
  | { allowed: false; reason: "disabled" | "non_prod_not_allowlisted" }

/**
 * The send guard. Dev and production share ONE database, so a test order placed from a
 * dev branch lands in the same `orders` table as a real one — and a synced contact gets
 * tagged, and the tag fires a real WhatsApp message. This is the only thing standing
 * between a dev branch and a customer's phone, so every outbound path goes through it.
 *
 *   RESPONDIO_ENABLED !== "true" or no token    → blocked ("disabled")
 *   VERCEL_ENV === "production"                 → allowed, env "production"
 *   phone ∈ RESPONDIO_TEST_PHONES               → allowed, env "test"
 *   anything else                               → blocked ("non_prod_not_allowlisted")
 *
 * Note: local `next dev` has no VERCEL_ENV, so locally only allowlisted numbers pass.
 */
export function resolveSyncMode(phoneE164: string, env: Env = process.env): SyncMode {
  if (!isRespondIoEnabled(env)) return { allowed: false, reason: "disabled" }
  if (env.VERCEL_ENV === "production") return { allowed: true, env: "production" }
  if (parseTestPhones(env.RESPONDIO_TEST_PHONES).has(phoneE164)) return { allowed: true, env: "test" }
  return { allowed: false, reason: "non_prod_not_allowlisted" }
}

/** "+212612345678" → "+212•••••678" for logs and the health endpoint. */
export function maskPhone(phone: string): string {
  if (phone.length <= 7) return "•••"
  return `${phone.slice(0, 4)}•••••${phone.slice(-3)}`
}
