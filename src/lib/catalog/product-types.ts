import { cache } from "react"
import type { Payload } from "payload"

/** Numeric id of a product type by its stable slug ("chales", "pulls"…), or null. Per-request cached. */
export const getProductTypeId = cache(async (payload: Payload, slug: string): Promise<number | null> => {
  const res = await payload.find({
    collection: "product-types",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const id = res.docs[0]?.id
  return id == null ? null : Number(id)
})
