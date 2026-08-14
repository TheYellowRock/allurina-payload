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

  // Detached from the parent scarf write on purpose: this is a cosmetic accessibility-text
  // sync, not part of the scarf's own data integrity, so it doesn't need to share the
  // parent's transaction. Forwarding `req` as-is would pin the scarf save's transactional
  // pg client, and firing these concurrently via Promise.all on that shared client is what
  // caused "client.query() when the client is already executing a query" — a scarf with
  // more than one linked image (featuredImage + any galleryImages) hits this every save.
  // A req without `transactionID` makes each call use its own pooled connection, so
  // sequential awaits here are just for predictable ordering, not required for safety.
  const detachedReq = { ...req, transactionID: undefined }
  for (const id of ids) {
    await req.payload.update({
      collection: 'media',
      id,
      data: { alt },
      req: detachedReq,
      overrideAccess: true,
    })
  }
}
