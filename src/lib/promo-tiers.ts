/**
 * Thin re-export shim. The tier-bundle promo now lives in
 * `lib/promotions/definitions/tiers-2026-08.ts` as part of the promotions registry
 * (`lib/promotions/registry.ts`) — this file exists only so pre-existing imports keep
 * working unchanged. New code should go through `lib/promotions/active.ts`
 * (`getActivePromo()`) instead of importing tier constants directly, since the active
 * promo is no longer necessarily this one.
 */
export {
  BULK_UNIT_PRICE,
  nextTier,
  PROMO_TIERS,
  resolveTierPrice as resolvePromoPrice,
} from "./promotions/definitions/tiers-2026-08"
export type { PromoTier, TierPriceResult as PromoPriceResult } from "./promotions/definitions/tiers-2026-08"
