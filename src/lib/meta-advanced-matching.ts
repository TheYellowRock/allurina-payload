import {
  buildExternalId,
  normalizeCity,
  normalizeEmail,
  normalizeName,
  normalizePhone,
} from "@/lib/meta-normalize"

/**
 * Browser-side (manual) Advanced Matching for `fbq('init', pixelId, data)`. Values here
 * are PLAIN, normalized text — the Pixel script hashes them itself (SHA-256) before
 * anything leaves the browser. Do NOT hash these: `@/lib/meta-hash` is server-only, for
 * the Conversions API — reusing it here would double-hash and silently break matching.
 */

export type AdvancedMatchingInput = {
  email: string
  phone: string
  firstName: string
  lastName: string
  city: string
}

export type AdvancedMatchingData = {
  /** Omitted when the customer gave no email — an empty `em` is noise for Meta. */
  em?: string
  ph: string
  /** Stable id derived from the phone number — plain text, the Pixel hashes it. */
  external_id?: string
  fn: string
  ln: string
  ct: string
  country: "ma"
}

export function buildAdvancedMatchingData(input: AdvancedMatchingInput): AdvancedMatchingData {
  const em = normalizeEmail(input.email)
  return {
    ...(em ? { em } : {}),
    ph: normalizePhone(input.phone),
    ...(buildExternalId(input.phone) ? { external_id: buildExternalId(input.phone) } : {}),
    fn: normalizeName(input.firstName),
    ln: normalizeName(input.lastName),
    ct: normalizeCity(input.city),
    country: "ma",
  }
}
