import { cache } from "react"
import { getPayload } from "payload"

import config from "@payload-config"
import { mapDocToStorefrontScarf } from "@/lib/mapStorefrontScarf"
import {
  availabilityBadgeTone,
  formatScarfPrice,
  storefrontMediaUrl,
} from "@/lib/storefront-scarf-display"
import type { StorefrontScarf } from "@/lib/storefront-scarf-types"

export type { StorefrontScarf } from "@/lib/storefront-scarf-types"

export { availabilityBadgeTone, formatScarfPrice, storefrontMediaUrl }

const NOUVEAUTES_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

async function getPayloadClient() {
  const resolvedConfig = await config
  return getPayload({ config: resolvedConfig })
}

/**
 * Reads scarves through the local Payload API (`getPayload`) and attaches a
 * resolved `availability` object for the Next.js storefront (and JSON routes).
 */
export const getScarvesWithAvailability = cache(async (): Promise<{
  scarves: StorefrontScarf[]
}> => {
  const payload = await getPayloadClient()

  const res = await payload.find({
    collection: "scarves",
    depth: 2,
    limit: 100,
    sort: "-updatedAt",
  })

  return {
    scarves: res.docs.map((doc) => mapDocToStorefrontScarf(doc as Record<string, unknown>)),
  }
})

/** All scarves (higher limit for catalog “toutes les pièces”). */
export const getAllScarvesWithAvailability = cache(async (): Promise<{
  scarves: StorefrontScarf[]
}> => {
  const payload = await getPayloadClient()

  const res = await payload.find({
    collection: "scarves",
    depth: 2,
    limit: 400,
    sort: "-updatedAt",
  })

  return {
    scarves: res.docs.map((doc) => mapDocToStorefrontScarf(doc as Record<string, unknown>)),
  }
})

/** Scarves whose `createdAt` is within the last 30 days. */
export const getNouveautesScarves = cache(async (): Promise<{
  scarves: StorefrontScarf[]
}> => {
  const payload = await getPayloadClient()
  const since = new Date(Date.now() - NOUVEAUTES_WINDOW_MS)

  const res = await payload.find({
    collection: "scarves",
    depth: 2,
    limit: 400,
    sort: "-createdAt",
  })

  const scarves = res.docs
    .filter((doc) => {
      const raw = (doc as { createdAt?: string }).createdAt
      if (!raw) return false
      return new Date(raw) >= since
    })
    .map((doc) => mapDocToStorefrontScarf(doc as Record<string, unknown>))

  return { scarves }
})

/** Scarves linked to a Payload category slug. */
export const getScarvesByCategorySlug = cache(
  async (categorySlug: string): Promise<{ scarves: StorefrontScarf[] }> => {
    const payload = await getPayloadClient()

    const cat = await payload.find({
      collection: "categories",
      where: { slug: { equals: categorySlug } },
      limit: 1,
      depth: 0,
    })

    const categoryId = cat.docs[0]?.id
    if (categoryId === undefined || categoryId === null) {
      return { scarves: [] }
    }

    const res = await payload.find({
      collection: "scarves",
      where: {
        categories: {
          contains: categoryId,
        },
      },
      depth: 2,
      limit: 400,
      sort: "-updatedAt",
    })

    return {
      scarves: res.docs.map((doc) => mapDocToStorefrontScarf(doc as Record<string, unknown>)),
    }
  },
)
