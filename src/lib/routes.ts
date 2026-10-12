/** Storefront product URL path (slug only). */
export function productPath(slug: string): string {
  return `/products/${encodeURIComponent(slug)}`
}

export const CHECKOUT_PATH = "/checkout"

export function checkoutConfirmationPath(orderReference: string): string {
  return `/checkout/confirmation?ref=${encodeURIComponent(orderReference)}`
}

export const NOUVEAUTES_PATH = "/nouveautes"

/** All scarves (every material). */
export const CHALES_PATH = "/chales"

/** All pulls, one card per colour. */
export const PULLS_PATH = "/pulls"

/** Product page with a colour pre-selected (`?couleur=<colour slug>`), for per-colour cards and ads. */
export function productColorPath(slug: string, colorSlug: string): string {
  return `${productPath(slug)}?couleur=${encodeURIComponent(colorSlug)}`
}

export const TOUTES_LES_PIECES_PATH = "/collections/toutes-les-articles"

/** Politique de confidentialité (exigences légales & vérification Meta). */
export const PRIVACY_POLICY_PATH = "/politique-confidentialite"

export function collectionPath(slug: string): string {
  return `/collections/${encodeURIComponent(slug)}`
}

export function chalesCategoryPath(slug: string): string {
  return `/chales/${encodeURIComponent(slug)}`
}
