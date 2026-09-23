import { createHash, timingSafeEqual } from "node:crypto"

import { sql } from "@payloadcms/db-postgres"
import { NextResponse } from "next/server"
import { getPayload } from "payload"

import config from "@payload-config"
import { listChannels } from "@/lib/respondio/client"
import { isRespondIoEnabled, maskPhone, parseTestPhones } from "@/lib/respondio/config"

/**
 * GET /api/respondio/health — debug view of the respond.io sync, without opening Supabase.
 *
 *   curl -s https://allurinascarf.com/api/respondio/health -H "X-Allurina-Secret: $RESPONDIO_HEALTH_SECRET"
 *
 * Returns the resolved guard state, a live token check against respond.io, sync counts
 * by status, and the ten most recent rows (phones masked). 404 without the right secret,
 * or when RESPONDIO_HEALTH_SECRET isn't set — the endpoint doesn't advertise itself.
 */

function secretMatches(provided: string, expected: string): boolean {
  // Hash both sides so timingSafeEqual always compares equal-length buffers.
  const a = createHash("sha256").update(provided).digest()
  const b = createHash("sha256").update(expected).digest()
  return timingSafeEqual(a, b)
}

export async function GET(req: Request) {
  const expected = process.env.RESPONDIO_HEALTH_SECRET
  const provided = req.headers.get("x-allurina-secret") ?? ""
  if (!expected || !secretMatches(provided, expected)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const guard = {
    enabled: isRespondIoEnabled(),
    vercelEnv: process.env.VERCEL_ENV ?? null,
    mode:
      !isRespondIoEnabled()
        ? "disabled"
        : process.env.VERCEL_ENV === "production"
          ? "production"
          : "test-allowlist-only",
    tokenPresent: Boolean(process.env.RESPONDIO_API_TOKEN),
    testPhones: [...parseTestPhones(process.env.RESPONDIO_TEST_PHONES)].map(maskPhone),
  }

  const [channels, table] = await Promise.all([
    guard.tokenPresent
      ? listChannels().then((r) =>
          r.ok
            ? {
                ok: true as const,
                channels: (r.data?.items ?? []).map((c) => ({ id: c.id, name: c.name, source: c.source })),
              }
            : { ok: false as const, status: r.status, error: r.error },
        )
      : Promise.resolve({ ok: false as const, status: 0, error: "no token" }),
    (async () => {
      try {
        const payload = await getPayload({ config: await config })
        const drizzle = payload.db.drizzle
        const [counts, recent] = await Promise.all([
          payload.db.execute({
            drizzle,
            sql: sql`SELECT sync_status, env, count(*)::int AS n
                       FROM integrations.respondio_sync
                   GROUP BY sync_status, env
                   ORDER BY sync_status, env`,
          }),
          payload.db.execute({
            drizzle,
            sql: sql`SELECT order_id, phone_e164, contact_id, env, sync_status, sync_error,
                            attempts, synced_at, created_at
                       FROM integrations.respondio_sync
                   ORDER BY created_at DESC
                      LIMIT 10`,
          }),
        ])
        return {
          ok: true as const,
          counts: counts.rows,
          recent: recent.rows.map((r: Record<string, unknown>) => ({
            ...r,
            phone_e164: maskPhone(String(r.phone_e164 ?? "")),
          })),
        }
      } catch (err) {
        return {
          ok: false as const,
          error: err instanceof Error ? err.message : String(err),
          hint: "Has scripts/respondio-sync.sql been run in the Supabase SQL editor?",
        }
      }
    })(),
  ])

  return NextResponse.json({ guard, respondio: channels, table }, { headers: { "Cache-Control": "no-store" } })
}
