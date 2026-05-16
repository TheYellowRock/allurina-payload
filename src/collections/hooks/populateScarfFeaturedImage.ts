import type { CollectionAfterReadHook } from 'payload'

/**
 * Admin list view requests scarves with depth 0, so upload fields stay as bare IDs and
 * custom list cells cannot resolve image URLs. Hydrate `featuredImage` when it is still
 * a primitive reference so the Aperçu column can render thumbnails.
 */
export const populateScarfFeaturedImage: CollectionAfterReadHook = async ({ doc, req }) => {
  const ref = doc.featuredImage
  if (ref === null || ref === undefined) return doc
  if (typeof ref === 'object') return doc

  try {
    const media = await req.payload.findByID({
      collection: 'media',
      id: ref,
      depth: 0,
      overrideAccess: false,
      req,
    })
    doc.featuredImage = media
  } catch {
    // Missing or forbidden media: leave ref as-is
  }

  return doc
}
