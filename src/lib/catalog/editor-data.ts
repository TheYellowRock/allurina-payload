import type { Payload, PayloadRequest } from "payload"
import { commitTransaction, createLocalReq, initTransaction, killTransaction } from "payload"

import { lexicalToPlainText, plainTextToLexical } from "./description"
import {
  variantKey,
  type EditorImage,
  type EditorOption,
  type EditorOptions,
  type ProductEditorValues,
  type ProductSavePayload,
} from "./editor-types"

/** Server-only loaders for the Studio quick product editor. */

function relId(value: unknown): number | null {
  if (typeof value === "number") return value
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value)
  if (value && typeof value === "object" && "id" in value) return relId((value as { id: unknown }).id)
  return null
}

function relIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value.map(relId).filter((id): id is number => id !== null)
}

/** `thumb` = the 80×80 admin thumbnail, for list rows; otherwise the full photo. */
export function mediaUrl(value: unknown, thumb = false): string | null {
  if (!value || typeof value !== "object") return null
  const o = value as { url?: unknown; sizes?: { adminThumb?: { url?: unknown } } }
  const small = o.sizes?.adminThumb?.url
  if (thumb && typeof small === "string" && small) return small
  return typeof o.url === "string" && o.url ? o.url : null
}

function toImage(value: unknown): EditorImage | null {
  const id = relId(value)
  if (id === null) return null
  return { id, url: mediaUrl(value) }
}

/** Main photo first, then gallery, deduplicated by id — the order the storefront shows them. */
export function productImages(doc: Record<string, unknown>): EditorImage[] {
  const out: EditorImage[] = []
  const seen = new Set<number>()
  for (const raw of [doc.featuredImage, ...(Array.isArray(doc.galleryImages) ? doc.galleryImages : [])]) {
    const img = toImage(raw)
    if (img && !seen.has(img.id)) {
      seen.add(img.id)
      out.push(img)
    }
  }
  return out
}

export async function loadEditorOptions(payload: Payload): Promise<EditorOptions> {
  const common = { depth: 0, limit: 500, pagination: false, overrideAccess: true } as const
  const [types, categories, collections, tags, sizes, colors] = await Promise.all([
    payload.find({ collection: "product-types", sort: "navOrder", ...common }),
    payload.find({ collection: "categories", sort: "name", ...common }),
    payload.find({ collection: "collections", sort: "name", ...common }),
    payload.find({ collection: "tags", sort: "name", ...common }),
    payload.find({ collection: "sizes", sort: "sortOrder", ...common }),
    payload.find({ collection: "colors", sort: "name", ...common }),
  ])
  const opt = (d: Record<string, unknown>, labelKey = "name"): EditorOption => ({
    id: Number(d.id),
    label: String(d[labelKey] ?? ""),
  })
  return {
    productTypes: types.docs.map((d) => ({ ...opt(d), slug: String(d.slug ?? "") })),
    categories: categories.docs.map((d) => ({ ...opt(d), productTypeId: relId(d.productType) })),
    collections: collections.docs.map((d) => opt(d)),
    tags: tags.docs.map((d) => opt(d)),
    sizes: sizes.docs.map((d) => ({ ...opt(d, "label"), productTypeId: relId(d.productType) })),
    colors: colors.docs.map((d) => ({ ...opt(d), hex: String(d.hex ?? "#cccccc") })),
  }
}

export type LoadedProduct = {
  id: number
  slug: string
  variantCount: number
  values: ProductEditorValues
}

export async function loadProductForEditor(payload: Payload, id: number): Promise<LoadedProduct | null> {
  let doc: Record<string, unknown>
  try {
    doc = (await payload.findByID({
      collection: "scarves",
      id,
      depth: 1,
      overrideAccess: true,
    })) as Record<string, unknown>
  } catch {
    return null
  }
  const variants = await payload.find({
    collection: "product-variants",
    where: { product: { equals: id } },
    depth: 0,
    limit: 1000,
    pagination: false,
    overrideAccess: true,
  })
  const sizeIds = new Set<number>()
  const colorIds = new Set<number>()
  const variantStock: Record<string, string> = {}
  for (const v of variants.docs) {
    const sizeId = relId(v.size)
    const colorId = relId(v.color)
    if (sizeId === null || colorId === null) continue
    sizeIds.add(sizeId)
    colorIds.add(colorId)
    variantStock[variantKey(sizeId, colorId)] = String(v.stockQuantity ?? 0)
  }
  const colorImages = (Array.isArray(doc.colorImages) ? (doc.colorImages as Record<string, unknown>[]) : [])
    .map((entry) => ({
      colorId: relId(entry.color),
      images: (Array.isArray(entry.images) ? entry.images : [])
        .map(toImage)
        .filter((img): img is EditorImage => img !== null),
    }))
    .filter((e): e is { colorId: number; images: EditorImage[] } => e.colorId !== null)
  for (const entry of colorImages) colorIds.add(entry.colorId)

  return {
    id,
    slug: String(doc.slug ?? ""),
    variantCount: variants.totalDocs,
    values: {
      title: String(doc.title ?? ""),
      price: doc.price != null ? String(doc.price) : "",
      stockQuantity: doc.stockQuantity != null ? String(doc.stockQuantity) : "",
      productTypeId: relId(doc.productType),
      hasVariants: doc.hasVariants === true,
      images: productImages(doc),
      description: lexicalToPlainText(doc.description),
      categoryIds: relIds(doc.categories),
      collectionIds: relIds(doc.collections),
      tagIds: relIds(doc.tags),
      sizeIds: [...sizeIds],
      colorIds: [...colorIds],
      variantStock,
      colorImages,
    },
  }
}

/** Values for "Dupliquer": same price, type, description and classification; new title, no photos, stock to fill in. */
export function duplicateValues(source: ProductEditorValues): ProductEditorValues {
  return {
    ...source,
    title: `${source.title} (copie)`,
    images: [],
    stockQuantity: "",
    // Same sizes/colours grid, stock to fill in; colour photos belong to the original.
    variantStock: {},
    colorImages: [],
  }
}

export function emptyValues(defaultTypeId: number | null): ProductEditorValues {
  return {
    title: "",
    price: "",
    stockQuantity: "",
    productTypeId: defaultTypeId,
    hasVariants: false,
    images: [],
    description: "",
    categoryIds: [],
    collectionIds: [],
    tagIds: [],
    sizeIds: [],
    colorIds: [],
    variantStock: {},
    colorImages: [],
  }
}

/** Maps the validated editor payload to Payload `scarves` data. First photo = main photo. */
export function toProductData(input: ProductSavePayload): Record<string, unknown> {
  const [featured, ...gallery] = input.imageIds
  return {
    title: input.title,
    price: input.price,
    stockQuantity: input.stockQuantity,
    productType: input.productType,
    hasVariants: input.hasVariants,
    featuredImage: featured ?? null,
    galleryImages: gallery,
    categories: input.categories,
    collections: input.collections,
    tags: input.tags,
    ...(input.description !== undefined ? { description: plainTextToLexical(input.description) } : {}),
    ...(input.colorImages
      ? { colorImages: input.colorImages.map((c) => ({ color: c.colorId, images: c.imageIds })) }
      : {}),
  }
}

/**
 * Brings a product's `product-variants` rows in line with the editor's grid: updates the
 * stock of existing size × colour rows, creates missing ones, deletes rows no longer in
 * the grid. Each write runs Payload hooks (label/SKU, parent stock total) on `req`.
 * A variant's own price override, set in Payload, is left untouched.
 */
async function syncVariants(
  payload: Payload,
  req: PayloadRequest,
  productId: number,
  grid: NonNullable<ProductSavePayload["variants"]>,
): Promise<void> {
  const existing = await payload.find({
    collection: "product-variants",
    where: { product: { equals: productId } },
    depth: 0,
    limit: 1000,
    pagination: false,
    overrideAccess: true,
    req,
  })
  const byKey = new Map(
    existing.docs.map((v) => [variantKey(relId(v.size) ?? 0, relId(v.color) ?? 0), v as Record<string, unknown>]),
  )
  const wanted = new Set(grid.map((g) => variantKey(g.sizeId, g.colorId)))

  for (const [key, doc] of byKey) {
    if (!wanted.has(key)) {
      await payload.delete({ collection: "product-variants", id: doc.id as number, overrideAccess: true, req })
    }
  }
  for (const cell of grid) {
    const doc = byKey.get(variantKey(cell.sizeId, cell.colorId))
    if (doc) {
      if (Number(doc.stockQuantity ?? 0) !== cell.stockQuantity) {
        await payload.update({
          collection: "product-variants",
          id: doc.id as number,
          data: { stockQuantity: cell.stockQuantity },
          overrideAccess: true,
          req,
        })
      }
    } else {
      await payload.create({
        collection: "product-variants",
        data: { product: productId, size: cell.sizeId, color: cell.colorId, stockQuantity: cell.stockQuantity },
        overrideAccess: true,
        req,
      })
    }
  }
}

/**
 * Creates (`id` null) or updates a product and, for products with variants, its whole
 * size × colour grid — in ONE database transaction: either everything is saved or
 * nothing is (no product left half-created with missing variants).
 */
export async function saveProduct(
  payload: Payload,
  user: PayloadRequest["user"],
  id: number | null,
  input: ProductSavePayload,
): Promise<{ id: number; slug: string }> {
  const req = await createLocalReq({ user: user ?? undefined }, payload)
  await initTransaction(req)
  try {
    const data = toProductData(input) as never
    const doc = id
      ? await payload.update({ collection: "scarves", id, data, overrideAccess: true, req })
      : await payload.create({ collection: "scarves", data, overrideAccess: true, req })
    const productId = Number(doc.id)

    if (input.hasVariants && input.variants) {
      await syncVariants(payload, req, productId, input.variants)
    }
    await commitTransaction(req)
    return { id: productId, slug: String(doc.slug ?? "") }
  } catch (err) {
    await killTransaction(req)
    throw err
  }
}
