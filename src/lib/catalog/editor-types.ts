/**
 * Shapes shared by the Studio quick product editor (client) and its API routes
 * (server). Plain JSON only — safe to import from client components.
 */

export type EditorImage = { id: number; url: string | null }

export type EditorOption = { id: number; label: string; productTypeId?: number | null }

export type EditorSize = { id: number; label: string; productTypeId: number | null }
export type EditorColor = { id: number; label: string; hex: string }

export type EditorOptions = {
  productTypes: (EditorOption & { slug: string })[]
  categories: EditorOption[]
  collections: EditorOption[]
  tags: EditorOption[]
  /** Sorted smallest → largest. */
  sizes: EditorSize[]
  colors: EditorColor[]
}

/** Key of one cell of the size × colour grid. */
export function variantKey(sizeId: number, colorId: number): string {
  return `${sizeId}:${colorId}`
}

/** What the editor form holds and sends. Photos: first = main photo ("Aperçu"), rest = gallery. */
export type ProductEditorValues = {
  title: string
  price: string
  stockQuantity: string
  productTypeId: number | null
  hasVariants: boolean
  images: EditorImage[]
  description: string
  categoryIds: number[]
  collectionIds: number[]
  tagIds: number[]
  /** Products with variants only: chosen sizes and colours (grid rows/columns). */
  sizeIds: number[]
  colorIds: number[]
  /** Stock per grid cell, keyed by `variantKey(sizeId, colorId)`. Empty/missing = 0. */
  variantStock: Record<string, string>
  /** Photos per colour (the gallery switches when the customer picks that colour). */
  colorImages: { colorId: number; images: EditorImage[] }[]
}

/** JSON body of POST/PATCH /api/studio/products. `description` omitted = leave unchanged. */
export type ProductSavePayload = {
  title: string
  price: number
  stockQuantity: number
  productType: number
  hasVariants: boolean
  imageIds: number[]
  description?: string
  categories: number[]
  collections: number[]
  tags: number[]
  /** Products with variants: the full grid (every size × colour). Rows not listed are deleted. */
  variants?: { sizeId: number; colorId: number; stockQuantity: number }[]
  colorImages?: { colorId: number; imageIds: number[] }[]
}

function isIdArray(v: unknown): v is number[] {
  return Array.isArray(v) && v.every((x) => Number.isInteger(x) && x > 0)
}

/** Server-side validation of the save payload. French messages are shown as-is in the editor. */
export function parseProductSavePayload(
  body: unknown,
): { ok: true; data: ProductSavePayload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Requête invalide." }
  const b = body as Record<string, unknown>

  const title = typeof b.title === "string" ? b.title.trim().slice(0, 200) : ""
  if (title.length < 2) return { ok: false, error: "Indiquez un titre (2 caractères minimum)." }

  const price = typeof b.price === "number" ? b.price : NaN
  if (!Number.isFinite(price) || price < 0 || price > 100000) {
    return { ok: false, error: "Prix invalide." }
  }

  const hasVariants = b.hasVariants === true
  const stockQuantity = typeof b.stockQuantity === "number" ? b.stockQuantity : NaN
  if (!hasVariants && (!Number.isInteger(stockQuantity) || stockQuantity < 0 || stockQuantity > 100000)) {
    return { ok: false, error: "Stock invalide (nombre entier, 0 ou plus)." }
  }

  const productType = b.productType
  if (!Number.isInteger(productType) || (productType as number) <= 0) {
    return { ok: false, error: "Choisissez un type de produit." }
  }

  for (const key of ["imageIds", "categories", "collections", "tags"] as const) {
    if (!isIdArray(b[key])) return { ok: false, error: "Requête invalide." }
  }
  const imageIds = [...new Set(b.imageIds as number[])].slice(0, 30)

  let description: string | undefined
  if (b.description !== undefined) {
    if (typeof b.description !== "string") return { ok: false, error: "Description invalide." }
    description = b.description.slice(0, 10000)
  }

  let variants: ProductSavePayload["variants"]
  let colorImages: ProductSavePayload["colorImages"]
  if (hasVariants) {
    if (!Array.isArray(b.variants) || b.variants.length > 400) return { ok: false, error: "Grille tailles × couleurs invalide." }
    const seen = new Set<string>()
    variants = []
    for (const raw of b.variants) {
      const v = raw as Record<string, unknown>
      const sizeId = v?.sizeId
      const colorId = v?.colorId
      const stock = v?.stockQuantity
      if (
        !Number.isInteger(sizeId) ||
        !Number.isInteger(colorId) ||
        !Number.isInteger(stock) ||
        (stock as number) < 0 ||
        (stock as number) > 100000
      ) {
        return { ok: false, error: "Stock de variante invalide (nombre entier, 0 ou plus)." }
      }
      const key = `${sizeId}:${colorId}`
      if (seen.has(key)) return { ok: false, error: "Variante en double." }
      seen.add(key)
      variants.push({ sizeId: sizeId as number, colorId: colorId as number, stockQuantity: stock as number })
    }
    if (variants.length === 0) return { ok: false, error: "Choisissez au moins une taille et une couleur." }

    colorImages = []
    for (const raw of Array.isArray(b.colorImages) ? b.colorImages : []) {
      const c = raw as Record<string, unknown>
      if (!Number.isInteger(c?.colorId) || !isIdArray(c?.imageIds)) return { ok: false, error: "Photos par couleur invalides." }
      const imageIds = [...new Set(c.imageIds as number[])].slice(0, 20)
      if (imageIds.length) colorImages.push({ colorId: c.colorId as number, imageIds })
    }
  }

  return {
    ok: true,
    data: {
      title,
      price: Math.round(price * 100) / 100,
      stockQuantity: hasVariants ? 0 : stockQuantity,
      productType: productType as number,
      hasVariants,
      imageIds,
      ...(description !== undefined ? { description } : {}),
      categories: [...new Set(b.categories as number[])],
      collections: [...new Set(b.collections as number[])],
      tags: [...new Set(b.tags as number[])],
      ...(variants ? { variants } : {}),
      ...(colorImages ? { colorImages } : {}),
    },
  }
}
