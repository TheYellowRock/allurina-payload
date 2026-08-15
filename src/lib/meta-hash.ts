import { createHash } from "node:crypto"

import { normalizeCity, normalizeEmail, normalizeName, normalizePhone } from "@/lib/meta-normalize"

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
    const normalized = normalizeName(input.firstName)
    if (normalized) out.fn = sha256Hex(normalized)
  }
  if (input.lastName) {
    const normalized = normalizeName(input.lastName)
    if (normalized) out.ln = sha256Hex(normalized)
  }
  if (input.city) {
    const normalized = normalizeCity(input.city)
    if (normalized) out.ct = sha256Hex(normalized)
  }
  if (input.externalId) {
    const normalized = input.externalId.trim()
    if (normalized) out.external_id = sha256Hex(normalized)
  }

  return out
}
