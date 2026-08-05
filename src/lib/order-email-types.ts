/** Normalized order payload for transactional emails (from Payload `orders` + JSON `items`). */
export type OrderEmailLine = {
  title: string
  quantity: number
  unitPriceDh: number
  lineTotalDh: number
  /** Absolute URL for email clients; null if missing or cannot be resolved. */
  imageSrc: string | null
}

export type OrderEmailProps = {
  /** Absolute URL to `/allurina-scarf-logo.png` (see `normalizeEmailPublicBase` in `email.ts`). */
  logoUrl: string | null
  orderReference: string
  customerName: string
  email: string
  phone: string
  addressLine1: string
  addressLine2: string | null
  city: string
  postalCode: string
  country: string
  notes: string | null
  paymentMethod: string
  status: string
  lines: OrderEmailLine[]
  subtotalDh: number
  /** "4+1" promo — cheapest unit's price, waived once cart reaches 5 pièces. */
  volumeDiscountDh: number
  /** Unused (kept for template typing). */
  volumeRemiseLineDh: number
  deliveryFeeDh: number
  grandTotalDh: number
}
