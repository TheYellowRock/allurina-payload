/** Replace common French ligatures before NFD strip (œ/æ don’t always decompose to ASCII). */
const LIGATURE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/œ/g, "oe"],
  [/Œ/g, "oe"],
  [/æ/g, "ae"],
  [/Æ/g, "ae"],
]

/**
 * URL-safe slug from a display title: lowercase, accents → ASCII, spaces → `-`.
 * Safe for Payload + storefront paths.
 */
export function slugifyTitle(raw: string): string {
  let s = raw.trim()
  if (!s) return ""

  for (const [re, rep] of LIGATURE_REPLACEMENTS) {
    s = s.replace(re, rep)
  }

  s = s
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()

  s = s
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")

  return s.slice(0, 120).replace(/-+$/g, "")
}
