/** Where an unvalidated/rejected redirect target falls back to. */
const FALLBACK_PATH = "/orders_manager"

/**
 * Validates a same-origin path before it's ever embedded in (or read back from) a login
 * `redirect` param. Rules: must start with exactly one "/", never "//"-prefixed
 * (protocol-relative), never contain "://" or a backslash (host-escape attempts). Also
 * decodes first so an encoded variant (e.g. "/%2Fexample.com") can't slip past the
 * string checks — Payload's own `getSafeRedirect` guards the identical case. Falls back
 * to `/orders_manager` on any failure. Apply this at every point a redirect target
 * enters or leaves this app's own code, not just once at the source.
 */
export function safeOrdersManagerRedirectPath(candidate: string): string {
  if (typeof candidate !== "string" || candidate.length === 0) return FALLBACK_PATH

  let decoded: string
  try {
    decoded = decodeURIComponent(candidate)
  } catch {
    return FALLBACK_PATH
  }

  if (!decoded.startsWith("/")) return FALLBACK_PATH
  if (decoded.startsWith("//")) return FALLBACK_PATH
  if (decoded.includes("://")) return FALLBACK_PATH
  if (decoded.includes("\\")) return FALLBACK_PATH

  return decoded
}

/** The actual login route in this app — no `routes.admin` override in payload.config.ts, so Payload's default `/admin` prefix applies. */
const LOGIN_PATH = "/admin/login"

/** Builds a validated `redirect`-carrying login URL that lands the user back on `currentPath` post-login. */
export function buildLoginRedirectUrl(currentPath: string): string {
  const safePath = safeOrdersManagerRedirectPath(currentPath)
  return `${LOGIN_PATH}?redirect=${encodeURIComponent(safePath)}`
}
