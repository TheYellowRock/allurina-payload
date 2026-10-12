import type { CollectionBeforeValidateHook } from 'payload'

function relId(value: unknown): number | string | null {
  if (value == null) return null
  if (typeof value === 'number' || typeof value === 'string') return value
  if (typeof value === 'object' && 'id' in value) {
    const id = (value as { id: unknown }).id
    return typeof id === 'number' || typeof id === 'string' ? id : null
  }
  return null
}

/**
 * Fills the read-only `label` ("Pull Nora — M/L · Noir") and `sku`
 * ("pull-nora-m-l-noir") from the product, size and colour, on create and update.
 */
export const variantIdentity: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (!data) return data
  const productId = relId(data.product ?? originalDoc?.product)
  const sizeId = relId(data.size ?? originalDoc?.size)
  const colorId = relId(data.color ?? originalDoc?.color)
  if (productId == null || sizeId == null || colorId == null) return data

  const [product, size, color] = await Promise.all([
    req.payload.findByID({ collection: 'scarves', id: productId, depth: 0, req, overrideAccess: true }),
    req.payload.findByID({ collection: 'sizes', id: sizeId, depth: 0, req, overrideAccess: true }),
    req.payload.findByID({ collection: 'colors', id: colorId, depth: 0, req, overrideAccess: true }),
  ])

  const title = String(product?.title ?? '')
  const sizeLabel = String(size?.label ?? '')
  const colorName = String(color?.name ?? '')

  data.label = `${title} — ${sizeLabel} · ${colorName}`
  data.sku = [product?.slug, size?.slug, color?.slug]
    .map((s) => String(s ?? '').trim())
    .filter(Boolean)
    .join('-')
  return data
}
