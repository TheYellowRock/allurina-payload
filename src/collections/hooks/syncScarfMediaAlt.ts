import type { CollectionAfterChangeHook } from 'payload'

function collectMediaIds(value: unknown, into: Set<string | number>): void {
  if (value == null) return
  if (Array.isArray(value)) {
    for (const item of value) collectMediaIds(item, into)
    return
  }
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id: string | number }).id
    if (typeof id === 'string' || typeof id === 'number') into.add(id)
    return
  }
  if (typeof value === 'string' || typeof value === 'number') into.add(value)
}

/**
 * Sets `media.alt` to `Allurina scarf - "<title>"` for featured + gallery uploads
 * so bulk gallery uploads get a consistent, simple alt without manual entry.
 */
export const syncScarfMediaAlt: CollectionAfterChangeHook = async ({ doc, req }) => {
  const title =
    typeof doc.title === 'string' && doc.title.trim() ? doc.title.trim() : ''
  const alt = title ? `Allurina scarf - "${title}"` : 'Allurina scarf'

  const ids = new Set<string | number>()
  collectMediaIds(doc.featuredImage, ids)
  collectMediaIds(doc.galleryImages, ids)

  if (ids.size === 0) return

  await Promise.all(
    [...ids].map((id) =>
      req.payload.update({
        collection: 'media',
        id,
        data: { alt },
        req,
        overrideAccess: true,
      }),
    ),
  )
}
