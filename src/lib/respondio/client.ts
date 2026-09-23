/**
 * Minimal respond.io Developer API v2 client — plain `fetch`, no dependency.
 *
 * Paths and body shapes mirror the official `@respond-io/typescript-sdk` (v1.4.0) exactly;
 * we don't depend on it because it pulls in axios for four calls and would need an
 * install + lockfile change. Auth: workspace access token from
 * Settings → Integrations → Developer API, sent as a bearer token.
 *
 * Never throws: every call resolves to `{ ok: true, data }` or `{ ok: false, error }`.
 * Retries (every call used here is an upsert or a set-add, so a retry is always safe):
 * - 429 / 5xx / network errors: up to 3 attempts, exponential backoff, honours `retry-after`.
 * - 449 "request is in the queue": respond.io returns this right after a contact is
 *   created, while it's still being processed — typically on the tag call that follows the
 *   upsert. Waits longer (2s, 4s, 8s, 16s — ~30s total) before giving up; a row that still
 *   fails is picked up later by `npm run respondio:retry`.
 *
 * This file does NOT apply the environment guard — callers must go through
 * `resolveSyncMode()` in `./config` first. `sync.ts` is the only production caller.
 */

const BASE_URL = "https://api.respond.io/v2"
const REQUEST_TIMEOUT_MS = 8_000
const MAX_ATTEMPTS = 3
const MAX_BACKOFF_MS = 10_000
/** 449 = respond.io is still processing the contact ("in the queue"). */
const QUEUED_STATUS = 449
const QUEUED_DELAYS_MS = [2_000, 4_000, 8_000, 16_000]

export type RespondIoIdentifier = `phone:${string}` | `email:${string}` | `id:${number}`

export type RespondIoCustomField = { name: string; value: string | number | boolean | null }

export type RespondIoContactFields = {
  firstName: string
  lastName?: string | null
  phone?: string | null
  email?: string | null
  language?: string | null
  countryCode?: string | null
  custom_fields?: RespondIoCustomField[] | null
}

export type RespondIoContact = RespondIoContactFields & {
  id: number
  tags?: string[]
  created_at?: number
}

export type RespondIoChannel = { id: number; name: string; source: string }

export type RespondIoResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string }

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function extractMessage(body: unknown): string | null {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>
    if (typeof b.message === "string") return b.message
    if (typeof b.error === "string") return b.error
  }
  if (typeof body === "string" && body.length > 0) return body.slice(0, 300)
  return null
}

async function request<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<RespondIoResult<T>> {
  const token = process.env.RESPONDIO_API_TOKEN
  if (!token) return { ok: false, status: 0, error: "RESPONDIO_API_TOKEN is not set" }

  let lastStatus = 0
  let lastError = "unknown error"

  let queuedRetries = 0

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    let retryDelayMs = Math.min(1_000 * 2 ** (attempt - 1), MAX_BACKOFF_MS)

    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
        cache: "no-store",
      })

      const text = await res.text()
      let parsed: unknown = null
      if (text) {
        try {
          parsed = JSON.parse(text)
        } catch {
          parsed = text
        }
      }

      if (res.ok) return { ok: true, status: res.status, data: parsed as T }

      lastStatus = res.status
      lastError = extractMessage(parsed) ?? `HTTP ${res.status}`

      // Queued: wait on its own longer schedule, without spending a normal attempt.
      if (res.status === QUEUED_STATUS && queuedRetries < QUEUED_DELAYS_MS.length) {
        await sleep(QUEUED_DELAYS_MS[queuedRetries++])
        attempt--
        continue
      }

      const retryable = res.status === 429 || res.status >= 500
      if (!retryable) break

      const retryAfterSec = Number(res.headers.get("retry-after"))
      if (Number.isFinite(retryAfterSec) && retryAfterSec > 0) {
        retryDelayMs = Math.min(retryAfterSec * 1_000, MAX_BACKOFF_MS)
      }
    } catch (err) {
      lastStatus = 0
      lastError =
        err instanceof Error
          ? err.name === "AbortError"
            ? `timeout after ${REQUEST_TIMEOUT_MS}ms`
            : err.message
          : String(err)
    } finally {
      clearTimeout(timer)
    }

    if (attempt < MAX_ATTEMPTS) await sleep(retryDelayMs)
  }

  return { ok: false, status: lastStatus, error: lastError }
}

/** `POST /contact/create_or_update/{identifier}` → `{ contactId }` */
export function createOrUpdateContact(identifier: RespondIoIdentifier, fields: RespondIoContactFields) {
  return request<{ contactId: number }>("POST", `/contact/create_or_update/${identifier}`, fields)
}

/** `POST /contact/{identifier}/tag` — body is the bare array of tag names. */
export function addContactTags(identifier: RespondIoIdentifier, tags: string[]) {
  return request<{ contactId: number }>("POST", `/contact/${identifier}/tag`, tags)
}

/** `GET /contact/{identifier}` */
export function getContact(identifier: RespondIoIdentifier) {
  return request<RespondIoContact>("GET", `/contact/${identifier}`)
}

/** `GET /space/channel` — used by the health check to prove the token works. */
export function listChannels() {
  return request<{ items: RespondIoChannel[] }>("GET", "/space/channel")
}
