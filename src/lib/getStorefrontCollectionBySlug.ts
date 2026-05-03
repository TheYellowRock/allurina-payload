import { cache } from "react"
import { getPayload } from "payload"

import config from "@payload-config"

import type { StorefrontCollection } from "./getStorefrontCollections"

export const getStorefrontCollectionBySlug = cache(
  async (slug: string): Promise<StorefrontCollection | null> => {
    const resolvedConfig = await config
    const payload = await getPayload({ config: resolvedConfig })

    const res = await payload.find({
      collection: "collections",
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })

    const doc = res.docs[0]
    if (!doc) return null

    return {
      name: String(doc.name ?? ""),
      slug: String(doc.slug ?? ""),
      description:
        typeof doc.description === "string" && doc.description.length > 0
          ? doc.description
          : null,
    }
  },
)
