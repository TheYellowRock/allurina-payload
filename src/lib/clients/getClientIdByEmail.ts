"use server"

import { getPayload } from "payload"

import config from "@payload-config"

/**
 * Meta CAPI `external_id` support for the `Purchase` event — looks up the `clients` record
 * that `upsertClientFromCheckout` already created/updated during checkout. Read-only,
 * tracking-only: no part of order creation depends on this.
 */
export async function getClientIdByEmail(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return null

  const resolvedConfig = await config
  const payload = await getPayload({ config: resolvedConfig })

  const res = await payload.find({
    collection: "clients",
    where: { email: { equals: normalized } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const client = res.docs[0]
  return client ? String(client.id) : null
}
