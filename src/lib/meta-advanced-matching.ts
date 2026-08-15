import { normalizeCity, normalizeEmail, normalizeName, normalizePhone } from "@/lib/meta-normalize"

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
  em: string
  ph: string
  fn: string
  ln: string
  ct: string
  country: "ma"
}

export function buildAdvancedMatchingData(input: AdvancedMatchingInput): AdvancedMatchingData {
  return {
    em: normalizeEmail(input.email),
    ph: normalizePhone(input.phone),
    fn: normalizeName(input.firstName),
    ln: normalizeName(input.lastName),
    ct: normalizeCity(input.city),
    country: "ma",
  }
}
