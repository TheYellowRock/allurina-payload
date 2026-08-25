import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getPayload } from "payload"

import config from "@payload-config"

import { buildLoginRedirectUrl } from "./safe-redirect"

/**
 * Payload admin / staff session (cookie from `/admin` login). Never redirects on its
 * own — this is also called from the orders PATCH Route Handler, where `redirect()`
 * (a Server Component/Server Action API) isn't valid; that caller returns its own 401
 * JSON instead. Page code that wants auto-redirect-to-login should use
 * `requireStaffUser` below.
 */
export async function getStaffUser() {
  const resolvedConfig = await config
  const payload = await getPayload({ config: resolvedConfig })
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })
  return { payload, user }
}

/**
 * Page-only helper: same session check, but redirects to Payload's login with a
 * validated `redirect` param when unauthenticated, so the operator lands back on
 * `currentPath` after logging in instead of the admin panel. Call only from a Server
 * Component being rendered for a page (never from a Route Handler).
 */
export async function requireStaffUser(currentPath: string) {
  const { payload, user } = await getStaffUser()
  if (!user) {
    redirect(buildLoginRedirectUrl(currentPath))
  }
  return { payload, user }
}
