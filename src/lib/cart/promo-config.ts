/**
 * Single toggle point for the site-wide cart promotion. Free delivery at volume always
 * applies; `four_plus_one` layers the cheapest-unit discount on top of it, while
 * `free_delivery` alone is the archived single-benefit variant. Swap this constant to
 * switch; a future admin-facing toggle can replace this hardcoded value without touching
 * any of its callers (`computeCartPricing`, `PromoSection`, `PromoMiniBanner`).
 */
export type PromoMode = "free_delivery" | "four_plus_one"

export const ACTIVE_PROMO: PromoMode = "four_plus_one"
