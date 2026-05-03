/** Client cart line — persisted in localStorage (see `CART_STORAGE_KEY`). */
export type CartLineItem = {
  productId: string
  slug: string
  title: string
  price: number
  quantity: number
  imageSrc: string | null
}

export type CartAddPayload = Omit<CartLineItem, "quantity"> & {
  quantity: number
}
