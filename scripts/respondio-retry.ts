/**
 * Re-runs the respond.io sync for orders whose sync failed (attempts < 5).
 *
 *   npm run respondio:retry -- dry-run       # list what would be retried
 *   npm run respondio:retry -- production    # retry for real
 *
 * Runs through scripts/respondio.cjs (jiti + the tsconfig aliases) — see that file for why.
 *
 * Needs RESPONDIO_ENABLED=true and RESPONDIO_API_TOKEN in your local .env.
 *
 * Why `production`: the send guard only lets production orders through when
 * VERCEL_ENV=production. Locally that variable isn't set, so without the flag this script
 * can only retry orders placed from a number in RESPONDIO_TEST_PHONES. The flag sets it
 * for this process only, as an explicit "yes, I mean real customers".
 *
 * `invalid_phone` rows are never retried — they need the order's phone fixed by hand.
 */
// Must stay the FIRST import: the Payload config reads DATABASE_URL while it's being
// imported, so .env has to be loaded before that (same as scripts/seed.ts).
import "dotenv/config"

import { sql } from "@payloadcms/db-postgres"
import { getPayload } from "payload"

import config from "../src/payload.config"
import { respondIoOrderFromDoc, syncOrderToRespondIo } from "../src/lib/respondio/sync"

// Dev and production share one database: a maintenance script must never trigger
// Payload's dev schema-push. This is the exact flag @payloadcms/db-postgres checks.
process.env.PAYLOAD_MIGRATING = "true"

/**
 * Exit only after stdout/stderr have flushed. In a Windows terminal Node writes console
 * output asynchronously, so a bare process.exit() right after console.error() can drop the
 * message entirely — the script then looks like it did nothing.
 */
async function exitAfterFlush(code: number): Promise<never> {
  await new Promise<void>((resolve) => process.stdout.write("", () => resolve()))
  await new Promise<void>((resolve) => process.stderr.write("", () => resolve()))
  process.exit(code)
}

const MAX_ATTEMPTS = 5
const BATCH = 50

const args = new Set(process.argv.slice(2).map((a) => String(a).replace(/^-+/, "")))
const dryRun = args.has("dry-run")
const production = args.has("production")
process.env.VERCEL_ENV = production ? "production" : "development"

async function main() {
  const payload = await getPayload({ config: await config })

  const { rows } = await payload.db.execute({
    drizzle: payload.db.drizzle,
    sql: sql`SELECT order_id, attempts, sync_error
               FROM integrations.respondio_sync
              WHERE sync_status = 'failed' AND attempts < ${MAX_ATTEMPTS}
           ORDER BY created_at
              LIMIT ${BATCH}`,
  })

  console.log(`${rows.length} failed sync(s) eligible for retry${dryRun ? " (dry run)" : ""}.`)
  const tally: Record<string, number> = {}

  for (const row of rows) {
    const orderId = String(row.order_id)
    const found = await payload.find({
      collection: "orders",
      where: { orderReference: { equals: orderId } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const input = found.docs[0] ? respondIoOrderFromDoc(found.docs[0] as unknown as Record<string, unknown>) : null

    if (!input) {
      console.warn(`  ${orderId}: order not found in \`orders\`, skipping`)
      tally.not_found = (tally.not_found ?? 0) + 1
      continue
    }
    if (dryRun) {
      console.log(`  ${orderId}: attempts=${row.attempts} last error: ${row.sync_error}`)
      continue
    }

    const outcome = await syncOrderToRespondIo(payload, input, { retry: true })
    tally[outcome.status] = (tally[outcome.status] ?? 0) + 1
    console.log(`  ${orderId}: ${outcome.status}${"error" in outcome ? ` — ${outcome.error}` : ""}${"reason" in outcome ? ` — ${outcome.reason}` : ""}`)
  }

  if (!dryRun) console.log("Done:", tally)
  await payload.destroy()
  await exitAfterFlush(0)
}

void main().catch(async (e) => {
  console.error(e)
  await exitAfterFlush(1)
})
