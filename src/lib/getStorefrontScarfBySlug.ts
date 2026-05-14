import { cache } from "react"
import { getPayload } from "payload"

import config from "@payload-config"
import { mapDocToStorefrontScarf } from "@/lib/mapStorefrontScarf"
import { productSlugLookupVariants } from "@/lib/normalizeProductSlug"
import type { StorefrontScarf } from "@/lib/storefront-scarf-types"

export const getStorefrontScarfBySlug = cache(
  async (slug: string): Promise<StorefrontScarf | null> => {
    const resolvedConfig = await config
    const payload = await getPayload({ config: resolvedConfig })

    const variants = productSlugLookupVariants(slug)
    if (variants.length === 0) return null

    const res = await payload.find({
      collection: "scarves",
      where:
        variants.length === 1
          ? { slug: { equals: variants[0] } }
          : { or: variants.map((s) => ({ slug: { equals: s } })) },
      limit: 1,
      depth: 2,
      overrideAccess: true,
    })

    const doc = res.docs[0]
    if (!doc) return null

    return mapDocToStorefrontScarf(doc as Record<string, unknown>)
  },
)
