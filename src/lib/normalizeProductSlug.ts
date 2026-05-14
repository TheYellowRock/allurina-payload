/**
 * `[slug]` from the App Router is usually decoded once. Some clients still send
 * percent-escapes in the segment; trim and decode safely when `%xx` is present.
 */
export function normalizeProductSlug(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return trimmed
  if (!/%[0-9A-Fa-f]{2}/.test(trimmed)) return trimmed
  try {
    return decodeURIComponent(trimmed).trim()
  } catch {
    return trimmed
  }
}

/** Unique slug candidates to try against Payload (order preserved). */
export function productSlugLookupVariants(raw: string): string[] {
  const trimmed = raw.trim()
  const normalized = normalizeProductSlug(raw)
  return [...new Set([normalized, trimmed].filter((s) => s.length > 0))]
}
