import { cartRules202609 } from "./definitions/cart-rules-2026-09"
import { packs202609 } from "./definitions/packs-2026-09"
import { tiers202608 } from "./definitions/tiers-2026-08"
import type { PromoDefinition } from "./types"

/**
 * Every registered promo, keyed by id. Adding a promo = one file under `definitions/`
 * plus one entry here — nothing else in this object changes for that.
 */
export const PROMO_REGISTRY: Record<string, PromoDefinition> = {
  [tiers202608.id]: tiers202608,
  [cartRules202609.id]: cartRules202609,
  [packs202609.id]: packs202609,
}

/** Falls back to when no activation record exists, the id is unknown, or nothing is currently scheduled. */
export const DEFAULT_PROMO_ID = tiers202608.id

export function getPromoDefinition(id: string): PromoDefinition | undefined {
  return PROMO_REGISTRY[id]
}

export function listPromoDefinitions(): PromoDefinition[] {
  return Object.values(PROMO_REGISTRY)
}
