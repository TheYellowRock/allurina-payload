/**
 * Everything a promo's pricing math needs from a cart/order line — deliberately smaller
 * than `CartLineItem`: title/slug/imageSrc are irrelevant to pricing, and keeping this
 * minimal means CAPI's `CapiProduct[]` (id/quantity/item_price) and Payload-derived order
 * lines can feed `resolve()` with a one-field rename, no fake placeholder data.
 */
export type PromoLineInput = { price: number; quantity: number }

export type PromoResolution = {
  total: number
  freeShipping: boolean
  savings: number
  /** Short, human-readable label for what was applied — shown in cart/checkout UI and the CRM preview. Null when nothing applied (e.g. below every threshold). */
  appliedLabel: string | null
}

/** One dot on the cart progress bar. */
export type PromoCartMilestone = {
  /** Item-count threshold this milestone represents. */
  qty: number
  label: string
}

export type PromoCartStatus = {
  /** Status line shown under the cart progress bar. */
  message: string
  /** 0-100 — how full the progress bar should render. */
  fillPercent: number
}

export type PromoBannerChip = {
  /** The large numeral this chip leads with — e.g. 3, 5, or a bundle price. */
  value: number
  /** Small label above/after the numeral — e.g. "châles". Omit if `value` is self-explanatory. */
  unit?: string
  /** Short line under the numeral — target under 5 words. */
  label: string
  highlight?: boolean
}

export type PromoBannerContent = {
  /** Small, quiet trust line rendered below the cards (e.g. COD reassurance) — not a headline. */
  subline?: string
  chips: PromoBannerChip[]
  footnote?: string
}

/**
 * A promotion, fully described as code. Adding a new promo means adding one file under
 * `definitions/` that exports one of these, plus one entry in `registry.ts` — nothing
 * else changes. `topBar`/`banner`/`cart` are the three storefront surfaces this
 * definition drives; `resolve` is the pricing authority both the client (for display)
 * and the server (checkout, CAPI) call — the server's call is the one that's binding.
 */
export type PromoDefinition = {
  id: string
  label: string
  /** Announcement bar copy shown site-wide. */
  topBar: string
  banner: PromoBannerContent
  cart: {
    milestones: PromoCartMilestone[]
    statusFor: (itemCount: number) => PromoCartStatus
  }
  resolve: (items: PromoLineInput[]) => PromoResolution
}
