import { cache } from "react"
import { getPayload } from "payload"

import config from "@payload-config"

export type StorefrontCategory = {
  name: string
  slug: string
  description: string | null
}

export const getStorefrontCategories = cache(async (): Promise<StorefrontCategory[]> => {
  const resolvedConfig = await config
  const payload = await getPayload({ config: resolvedConfig })

  const res = await payload.find({
    collection: "categories",
    limit: 50,
    sort: "name",
    depth: 0,
  })

  return res.docs.map((doc) => ({
    name: String(doc.name ?? ""),
    slug: String(doc.slug ?? ""),
    description:
      typeof doc.description === "string" && doc.description.length > 0
        ? doc.description
        : null,
  }))
})
