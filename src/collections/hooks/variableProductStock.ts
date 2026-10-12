import type { CollectionBeforeChangeHook } from 'payload'

/**
 * For a product with variants, `stockQuantity` is never typed in by hand: it is the sum of
 * the variants' stock. Recomputed on every save of the product (covers switching a product
 * to "with variants" after its variants exist, and stops an admin save from overwriting
 * the sum with a stale form value).
 */
export const variableProductStock: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  if (!data?.hasVariants) return data
  const id = originalDoc?.id
  if (id == null) {
    data.stockQuantity = 0
    return data
  }
  const res = await req.payload.find({
    collection: 'product-variants',
    where: { product: { equals: id } },
    depth: 0,
    limit: 1000,
    pagination: false,
    select: { stockQuantity: true },
    req,
    overrideAccess: true,
  })
  data.stockQuantity = res.docs.reduce((sum, v) => sum + Number(v.stockQuantity ?? 0), 0)
  return data
}
