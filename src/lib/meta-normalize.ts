/**
 * Meta-required field normalization only — no hashing here, and this file is safe to
 * import from both server and client code. Two very different consumers depend on it
 * producing identical output for the same input, or their match rates silently diverge:
 * - `src/lib/meta-hash.ts` (server-only) — hashes AFTER normalizing, for the Conversions API.
 * - `src/lib/meta-advanced-matching.ts` (browser-only) — hands these PLAIN normalized
 *   values to `fbq('init', ...)`; the Pixel script hashes them itself. Never hash a value
 *   before passing it there — pre-hashed input gets hashed a second time and silently
 *   breaks matching.
 */

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** Morocco-only: digits, country code, no `+`, no leading 0 (0612345678 -> 212612345678). */
export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "")
  if (digits.startsWith("00212")) digits = digits.slice(2)
  if (digits.startsWith("212")) return digits
  if (digits.startsWith("0")) return `212${digits.slice(1)}`
  return `212${digits}`
}

export function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

/** Meta's `ct` format: lowercase, spaces removed (not just trimmed). */
export function normalizeCity(city: string): string {
  return city.trim().toLowerCase().replace(/\s+/g, "")
}
