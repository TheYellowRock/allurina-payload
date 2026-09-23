/**
 * End-to-end smoke test of the respond.io sync, against YOUR OWN number only.
 *
 *   npm run respondio:smoke                   # uses the first number in RESPONDIO_TEST_PHONES
 *   npm run respondio:smoke -- 0612345678     # or name one explicitly
 *
 * Runs through scripts/respondio.cjs (jiti + the tsconfig aliases) — see that file for why.
 *
 * Needs in your local .env: RESPONDIO_ENABLED=true, RESPONDIO_API_TOKEN, and your number
 * in RESPONDIO_TEST_PHONES — the script refuses any number that isn't listed there.
 *
 * It syncs a synthetic order (SMOKE-…; never written to `orders`), reads the contact back
 * from respond.io and checks every custom field and tag landed, then re-syncs the same
 * order and checks nothing changed (idempotency).
 *
 * Heads-up: it really adds `cod-a-confirmer` to your contact, so if your Workflow is
 * already live it will fire — on your phone, with `env=test` and `test-ignore` set.
 * That's the point: it's how you test the Workflow end to end too.
 */
// Must stay the FIRST import: the Payload config reads DATABASE_URL while it's being
// imported, so .env has to be loaded before that (same as scripts/seed.ts).
import "dotenv/config"

import { sql } from "@payloadcms/db-postgres"
import { getPayload } from "payload"

import config from "../src/payload.config"
import { getContact } from "../src/lib/respondio/client"
import {
  RESPONDIO_FIELDS,
  RESPONDIO_TAGS,
  isRespondIoEnabled,
  parseTestPhones,
  toMoroccanE164,
} from "../src/lib/respondio/config"
import { buildContactFields, syncOrderToRespondIo, type RespondIoOrderInput } from "../src/lib/respondio/sync"

process.env.PAYLOAD_MIGRATING = "true" // never trigger Payload's dev schema-push
process.env.VERCEL_ENV = "development" // force the guard into test-allowlist mode

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

const POLL_TIMEOUT_MS = 60_000
const POLL_INTERVAL_MS = 3_000

let failures = 0
function check(label: string, ok: boolean, detail = "") {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${!ok && detail ? ` — ${detail}` : ""}`)
  if (!ok) failures++
}

async function main() {
  console.log("respond.io smoke test")
  if (!isRespondIoEnabled()) throw new Error("Set RESPONDIO_ENABLED=true and RESPONDIO_API_TOKEN in .env first.")

  const allowlist = parseTestPhones(process.env.RESPONDIO_TEST_PHONES)
  if (allowlist.size === 0) {
    throw new Error(
      "RESPONDIO_TEST_PHONES has no valid Moroccan number (expected e.g. 0612345678 — 10 digits starting 06/07).",
    )
  }

  // Optional positional phone argument; no argument → the first allowlisted number.
  const rawArg = process.argv.slice(2).find((a) => !String(a).startsWith("-"))
  const phone = rawArg !== undefined ? toMoroccanE164(String(rawArg)) : [...allowlist][0]

  if (!phone) {
    throw new Error(
      `Phone argument is not a valid Moroccan mobile number — expected 10 digits like 0612345678 ` +
        `(received ${String(rawArg).replace(/\D/g, "").replace(/^0+/, "").length} digits after the leading 0, need 9).`,
    )
  }
  if (!allowlist.has(phone)) {
    throw new Error(`${phone} is not in RESPONDIO_TEST_PHONES — refusing to touch a number that isn't yours.`)
  }
  console.log(`Smoke test against ${phone}`)

  const payload = await getPayload({ config: await config })
  const drizzle = payload.db.drizzle

  const order: RespondIoOrderInput = {
    orderReference: `SMOKE-${Date.now().toString(36).toUpperCase()}`,
    customerName: "Test Allurina Smoke",
    email: null,
    phone,
    addressLine1: "1 rue du Test",
    addressLine2: "Appt 2",
    city: "Tétouan",
    grandTotal: 220,
    items: [
      { title: "Signature test bleu", quantity: 2 },
      { title: "Signature test crème", quantity: 1 },
    ],
  }
  const identifier = `phone:${phone}` as const

  console.log(`\n1. First sync — ${order.orderReference}`)
  const first = await syncOrderToRespondIo(payload, order)
  check("outcome is synced", first.status === "synced", JSON.stringify(first))
  check("mode is test", first.status === "synced" && first.env === "test")

  // respond.io accepts writes immediately but applies them asynchronously (the same queue
  // behind its 449 "in the queue" responses), so an immediate read-back can still show the
  // previous order and no tags. Poll until this order's id and the tags are visible.
  console.log("\n2. Contact read back from respond.io (waiting for respond.io to apply the update)")
  const expectedTags = [RESPONDIO_TAGS.toConfirm, RESPONDIO_TAGS.test]
  const startedAt = Date.now()
  let res = await getContact(identifier)
  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    if (res.ok) {
      const fields = new Map((res.data.custom_fields ?? []).map((f) => [f.name, f.value]))
      const tags = res.data.tags ?? []
      if (fields.get(RESPONDIO_FIELDS.lastOrderId) === order.orderReference && expectedTags.every((t) => tags.includes(t))) {
        break
      }
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    res = await getContact(identifier)
  }
  const waitedSec = ((Date.now() - startedAt) / 1000).toFixed(1)
  console.log(`  (update visible after ${waitedSec}s)`)
  check("GET contact ok", res.ok, res.ok ? "" : `${res.status} ${res.error}`)

  if (res.ok) {
    const contact = res.data
    const actual = new Map((contact.custom_fields ?? []).map((f) => [f.name, f.value]))
    const expected = buildContactFields(order, phone, 0, "test").custom_fields ?? []

    for (const field of expected) {
      if (field.name === RESPONDIO_FIELDS.ordersCount) {
        check(`field ${field.name} present`, actual.has(field.name) && actual.get(field.name) !== null)
        continue
      }
      const got = actual.get(field.name)
      check(
        `field ${field.name}`,
        got !== undefined && String(got) === String(field.value),
        got === undefined
          ? "missing — does a Contact Field with exactly this Name exist in respond.io?"
          : `expected ${JSON.stringify(field.value)}, got ${JSON.stringify(got)}`,
      )
    }

    const tags = contact.tags ?? []
    check(`tag ${RESPONDIO_TAGS.toConfirm}`, tags.includes(RESPONDIO_TAGS.toConfirm), `tags: ${tags.join(", ")}`)
    check(`tag ${RESPONDIO_TAGS.test}`, tags.includes(RESPONDIO_TAGS.test), `tags: ${tags.join(", ")}`)
  }

  const readRow = async () =>
    (
      await payload.db.execute({
        drizzle,
        sql: sql`SELECT sync_status, attempts FROM integrations.respondio_sync WHERE order_id = ${order.orderReference}`,
      })
    ).rows[0]

  console.log("\n3. Idempotency — same order again")
  const before = await readRow()
  const second = await syncOrderToRespondIo(payload, order)
  const after = await readRow()
  check("second outcome is duplicate", second.status === "duplicate", JSON.stringify(second))
  check("row still synced", after?.sync_status === "synced", JSON.stringify(after))
  check("attempts unchanged", before?.attempts === after?.attempts, `${before?.attempts} → ${after?.attempts}`)

  console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) failed.\n`)
  await payload.destroy()
  await exitAfterFlush(failures === 0 ? 0 : 1)
}

void main().catch(async (e) => {
  console.error(`\nSmoke test stopped: ${e instanceof Error ? e.message : String(e)}\n`)
  await exitAfterFlush(1)
})
