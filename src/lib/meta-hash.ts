import { createHash } from "node:crypto"

/**
 * Server-only. Meta's Conversions API requires PII as SHA-256 hex digests of normalized
 * values. Never import this into a "use client" file — hashing must happen server-side,
 * inside `sendServerEvent` (`@/lib/conversions-api`), so raw PII never needs to leave the
 * server in the first place.
 */

export type RawUserData = {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  city?: string
  externalId?: string
}

/** Meta's abbreviated `user_data` field names for hashed values. */
export type HashedUserData = {
  em?: string
  ph?: string
  fn?: string
  ln?: string
  ct?: string
  external_id?: string
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** Morocco-only: digits, country code, no `+`, no leading 0 (0612345678 -> 212612345678). */
function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "")
  if (digits.startsWith("00212")) digits = digits.slice(2)
  if (digits.startsWith("212")) return digits
  if (digits.startsWith("0")) return `212${digits.slice(1)}`
  return `212${digits}`
}

function normalizeLower(value: string): string {
  return value.trim().toLowerCase()
}

export function hashUserData(input: RawUserData): HashedUserData {
  const out: HashedUserData = {}

  if (input.email) {
    const normalized = normalizeEmail(input.email)
    if (normalized) out.em = sha256Hex(normalized)
  }
  if (input.phone) {
    const normalized = normalizePhone(input.phone)
    if (normalized) out.ph = sha256Hex(normalized)
  }
  if (input.firstName) {
    const normalized = normalizeLower(input.firstName)
    if (normalized) out.fn = sha256Hex(normalized)
  }
  if (input.lastName) {
    const normalized = normalizeLower(input.lastName)
    if (normalized) out.ln = sha256Hex(normalized)
  }
  if (input.city) {
    const normalized = normalizeLower(input.city)
    if (normalized) out.ct = sha256Hex(normalized)
  }
  if (input.externalId) {
    const normalized = input.externalId.trim()
    if (normalized) out.external_id = sha256Hex(normalized)
  }

  return out
}
