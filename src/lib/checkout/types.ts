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
}

/** 409 response shape from `POST /api/store/checkout` when a line can't clear the atomic stock check. */
export type CheckoutStockFailure = {
  productId: string
  title: string
  availableStock: number
}
