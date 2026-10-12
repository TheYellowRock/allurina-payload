import type { CollectionBeforeDeleteHook } from 'payload'

/** Removes a product's variants before the product itself is deleted. */
export const deleteProductVariants: CollectionBeforeDeleteHook = async ({ id, req }) => {
  await req.payload.delete({
    collection: 'product-variants',
    where: { product: { equals: id } },
    req,
    overrideAccess: true,
  })
}
