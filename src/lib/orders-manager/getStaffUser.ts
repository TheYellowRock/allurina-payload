import { headers } from "next/headers"
import { getPayload } from "payload"

import config from "@payload-config"

/** Payload admin / staff session (cookie from `/admin` login). */
export async function getStaffUser() {
  const resolvedConfig = await config
  const payload = await getPayload({ config: resolvedConfig })
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })
  return { payload, user }
}
