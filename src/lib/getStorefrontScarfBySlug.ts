import { cache } from "react"
import { getPayload } from "payload"

import config from "@payload-config"
import { mapDocToStorefrontScarf } from "@/lib/mapStorefrontScarf"
import type { StorefrontScarf } from "@/lib/storefront-scarf-types"

export const getStorefrontScarfBySlug = cache(
  async (slug: string): Promise<StorefrontScarf | null> => {
    const resolvedConfig = await config
    const payload = await getPayload({ config: resolvedConfig })

    const res = await payload.find({
      collection: "scarves",
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 2,
    })

    const doc = res.docs[0]
    if (!doc) return null

    return mapDocToStorefrontScarf(doc as Record<string, unknown>)
  },
)
