/** Storefront product URL path (slug only). */
export function productPath(slug: string): string {
  return `/products/${encodeURIComponent(slug)}`
}

export const CHECKOUT_PATH = "/checkout"

export function checkoutConfirmationPath(orderReference: string): string {
  return `/checkout/confirmation?ref=${encodeURIComponent(orderReference)}`
}

export const NOUVEAUTES_PATH = "/nouveautes"

export const TOUTES_LES_PIECES_PATH = "/collections/toutes-les-articles"

export function collectionPath(slug: string): string {
  return `/collections/${encodeURIComponent(slug)}`
}

export function chalesCategoryPath(slug: string): string {
  return `/chales/${encodeURIComponent(slug)}`
}
