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
