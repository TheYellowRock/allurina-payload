/**
 * Single toggle point for the site-wide cart promotion. `free_delivery` and `four_plus_one`
 * are mutually exclusive — only one drives pricing and banners at a time. Swap this constant
 * to switch; a future admin-facing toggle can replace this hardcoded value without touching
 * any of its callers (`computeCartPricing`, `PromoSection`, `PromoMiniBanner`).
 */
export type PromoMode = "free_delivery" | "four_plus_one"

export const ACTIVE_PROMO: PromoMode = "four_plus_one"
