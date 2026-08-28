import { unstable_cache } from "next/cache"

import {
  isEdgeConfigWritable,
  missingWriteEnvVars,
  readActivePromoRecordFromEdgeConfig,
  writeActivePromoRecordToEdgeConfig,
} from "./activation-store"
import type { ActivePromoRecord } from "./activation-store"
import { DEFAULT_PROMO_ID, getPromoDefinition, listPromoDefinitions } from "./registry"
import type { PromoDefinition } from "./types"

export type { ActivePromoRecord } from "./activation-store"

export type ActivePromoBackingStore = "edge-config" | "env"

export function getActivePromoBackingStore(): ActivePromoBackingStore {
  return process.env.EDGE_CONFIG ? "edge-config" : "env"
}

/**
 * Raw record read, no schedule evaluation — cached below. Evaluating startsAt/endsAt
 * happens OUTSIDE the cache (see `getActivePromo`) so a queued promo activates exactly
 * at its scheduled instant instead of waiting for the cache to naturally expire.
 */
async function readActivePromoRecord(): Promise<ActivePromoRecord | null> {
  if (getActivePromoBackingStore() === "edge-config") {
    try {
      return await readActivePromoRecordFromEdgeConfig()
    } catch (err) {
      console.error("[promotions] Edge Config read failed — falling back to default promo", err)
      return null
    }
  }

  const promoId = process.env.ACTIVE_PROMO_ID?.trim()
  if (!promoId) return null
  // The env-var path has no way to express scheduling — you'd redeploy exactly when you
  // want the change live anyway, so there's nothing to schedule in advance for.
  return { promoId }
}

const readActivePromoRecordCached = unstable_cache(readActivePromoRecord, ["active-promo-record"], {
  tags: ["active-promo"],
})

function isWithinSchedule(record: ActivePromoRecord, now: Date): boolean {
  if (record.startsAt && now.getTime() < new Date(record.startsAt).getTime()) return false
  if (record.endsAt && now.getTime() >= new Date(record.endsAt).getTime()) return false
  return true
}

/**
 * The single implementation of the active-promo lookup today. Resolves
 * `{ promoId, startsAt, endsAt }` from whichever backing store is configured and returns
 * the matching definition — falling back to `DEFAULT_PROMO_ID` if nothing is active, the
 * id is unknown, or the record is scheduled outside the current window. Never returns
 * undefined: the registry is checked once at module load (see the throw below) so a
 * misconfigured `DEFAULT_PROMO_ID` fails loudly at build/boot time, not silently at
 * request time.
 */
export async function getActivePromo(now: Date = new Date()): Promise<PromoDefinition> {
  const fallback = getPromoDefinition(DEFAULT_PROMO_ID)
  if (!fallback) {
    throw new Error(`[promotions] DEFAULT_PROMO_ID "${DEFAULT_PROMO_ID}" is not registered`)
  }

  const record = await readActivePromoRecordCached()
  if (!record) return fallback
  if (!isWithinSchedule(record, now)) return fallback

  return getPromoDefinition(record.promoId) ?? fallback
}

export type PromoActivationState = "active" | "scheduled" | "inactive"

export type PromoStatusEntry = {
  definition: PromoDefinition
  state: PromoActivationState
  startsAt?: string
  endsAt?: string
}

export type PromotionsPanelData = {
  entries: PromoStatusEntry[]
  backingStore: ActivePromoBackingStore
  writable: boolean
  /** Names of missing env vars blocking writes — only meaningful when backingStore is "edge-config" and writable is false. */
  missingEnvVars: string[]
  resolvedId: string
}

/**
 * Activation is only ever writable when Edge Config is the backing store AND the
 * separate Management API credentials are present — env vars can't be rewritten by a
 * running server at all, and `@vercel/edge-config`'s SDK is read-only by design.
 */
export function canActivatePromoViaPanel(): boolean {
  return getActivePromoBackingStore() === "edge-config" && isEdgeConfigWritable()
}

/** Writes the activation record and is only reachable when `canActivatePromoViaPanel()` is true. */
export async function writeActivePromoRecord(record: ActivePromoRecord): Promise<void> {
  if (!canActivatePromoViaPanel()) {
    throw new Error("[promotions] Activation store is not writable in this deployment")
  }
  await writeActivePromoRecordToEdgeConfig(record)
}

/** Backing data for the /orders_manager?tab=promotions panel. */
export async function getPromotionsPanelData(now: Date = new Date()): Promise<PromotionsPanelData> {
  const backingStore = getActivePromoBackingStore()
  const writable = canActivatePromoViaPanel()
  const record = await readActivePromoRecordCached()
  const resolved = await getActivePromo(now)

  const entries: PromoStatusEntry[] = listPromoDefinitions().map((definition) => {
    const isTargeted = record?.promoId === definition.id
    let state: PromoActivationState = "inactive"

    if (isTargeted && record) {
      if (record.startsAt && now.getTime() < new Date(record.startsAt).getTime()) {
        state = "scheduled"
      } else if (record.endsAt && now.getTime() >= new Date(record.endsAt).getTime()) {
        state = "inactive"
      } else {
        state = "active"
      }
    } else if (!record && definition.id === DEFAULT_PROMO_ID) {
      state = "active"
    }

    return {
      definition,
      state,
      startsAt: isTargeted ? record?.startsAt : undefined,
      endsAt: isTargeted ? record?.endsAt : undefined,
    }
  })

  return {
    entries,
    backingStore,
    writable,
    missingEnvVars: backingStore === "edge-config" ? missingWriteEnvVars() : [],
    resolvedId: resolved.id,
  }
}
