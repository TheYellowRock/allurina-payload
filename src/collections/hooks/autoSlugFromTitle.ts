import type { CollectionBeforeValidateHook, Payload, Where } from "payload"

import { slugifyTitle } from "@/lib/slugifyTitle"

/**
 * Resolves `slug` unique among `scarves`, optionally ignoring the current document on update.
 */
export async function ensureUniqueScarfSlug(
  payload: Payload,
  base: string,
  excludeDocumentId?: string | number,
): Promise<string> {
  const root = (base || "piece").slice(0, 120).replace(/-+$/g, "") || "piece"
  let candidate = root
  let n = 2

  for (;;) {
    const where: Where =
      excludeDocumentId != null
        ? {
            and: [
              { slug: { equals: candidate } },
              { id: { not_equals: excludeDocumentId } },
            ],
          }
        : { slug: { equals: candidate } }

    const res = await payload.find({
      collection: "scarves",
      where,
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (res.docs.length === 0) return candidate

    candidate = `${root}-${n}`
    n += 1
  }
}

/**
 * Forces `slug` from `title` on every save so editors only maintain the display name.
 * Slug is read-only in the admin UI.
 */
export const autoSlugFromTitle: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  if (!data) return data

  const title = typeof data.title === "string" ? data.title.trim() : ""
  const base = slugifyTitle(title) || "piece"

  const excludeId =
    operation === "update" && originalDoc != null && originalDoc.id != null
      ? originalDoc.id
      : undefined

  const slug = await ensureUniqueScarfSlug(req.payload, base, excludeId)

  return { ...data, slug }
}
