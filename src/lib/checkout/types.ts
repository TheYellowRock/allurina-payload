export type CheckoutCustomerPayload = {
  customerName: string
  email: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  /** May be empty when the customer skips postal code. */
  postalCode: string
  country: string
  notes?: string
}

/**
 * What the client is trusted to send for a cart line at checkout time — just the product
 * and the desired quantity. Price/title/slug/imageSrc are re-derived server-side from
 * `scarves` in `POST /api/store/checkout`, never taken from the client.
 */
export type CheckoutLineInput = {
  productId: string
  quantity: number
}

export type CheckoutRequestPayload = {
  customer: CheckoutCustomerPayload
  items: CheckoutLineInput[]
  paymentMethod: "cod"
  /** Client-generated on checkout page mount; lets the server dedupe a resubmitted order. */
  idempotencyKey: string
  /**
   * The grand total the customer was shown when they pressed "Commander". Never used as a
   * price — the server always re-prices — only compared against the server's own result:
   * if they differ (promo switched mid-session, stale cache, price edit) the order is NOT
   * created and the client is told to refresh, so a customer is never recorded at an
   * amount different from the one displayed.
   */
  expectedGrandTotal?: number
}

/** 409 response shape when the server's total differs from `expectedGrandTotal`. */
export type CheckoutPriceMismatch = {
  priceMismatch: true
  serverGrandTotal: number
}

/** 409 response shape from `POST /api/store/checkout` when a line can't clear the atomic stock check. */
export type CheckoutStockFailure = {
  productId: string
  title: string
  availableStock: number
}
