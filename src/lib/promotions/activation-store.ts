import { get as edgeConfigGet } from "@vercel/edge-config"

/**
 * The Edge Config storage mechanics for promo activation, isolated from `active.ts`
 * (which owns the cached-read/schedule logic) and the CRM panel/registry — neither of
 * those knows or cares that this is Edge Config specifically. Swapping the backing
 * store later means changing only this file.
 */

export type ActivePromoRecord = {
  promoId: string
  startsAt?: string
  endsAt?: string
}

/** The Edge Config item key this app reads/writes activation state under. */
const EDGE_CONFIG_KEY = "activePromo"

/** Read path — always via the read-only `@vercel/edge-config` SDK, never the REST API. */
export async function readActivePromoRecordFromEdgeConfig(): Promise<ActivePromoRecord | null> {
  const value = await edgeConfigGet<ActivePromoRecord>(EDGE_CONFIG_KEY)
  return value ?? null
}

/**
 * Names of the env vars required to WRITE via the REST API — distinct from `EDGE_CONFIG`
 * (which only enables reads). `@vercel/edge-config`'s SDK is read-only by design; writes
 * go through Vercel's separate Edge Config Management API, which needs its own token and
 * the config's id.
 */
export const WRITE_ENV_VARS = ["EDGE_CONFIG_ID", "VERCEL_API_TOKEN"] as const

export function missingWriteEnvVars(): string[] {
  return WRITE_ENV_VARS.filter((name) => !process.env[name])
}

export function isEdgeConfigWritable(): boolean {
  return missingWriteEnvVars().length === 0
}

/**
 * Write path — Vercel's Edge Config Items REST API
 * (`PATCH https://api.vercel.com/v1/edge-config/{id}/items`), not the SDK. Only call
 * when `isEdgeConfigWritable()` is true.
 */
export async function writeActivePromoRecordToEdgeConfig(record: ActivePromoRecord): Promise<void> {
  const edgeConfigId = process.env.EDGE_CONFIG_ID
  const token = process.env.VERCEL_API_TOKEN
  if (!edgeConfigId || !token) {
    throw new Error(`[promotions] Edge Config write requires ${WRITE_ENV_VARS.join(" and ")}`)
  }

  const url = new URL(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`)
  const teamId = process.env.VERCEL_TEAM_ID
  if (teamId) url.searchParams.set("teamId", teamId)

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [{ operation: "upsert", key: EDGE_CONFIG_KEY, value: record }],
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`[promotions] Edge Config write failed (${res.status}): ${body}`)
  }
}
