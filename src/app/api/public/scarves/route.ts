import { NextResponse } from "next/server"
import { getPayload } from "payload"

import config from "@payload-config"
import { parseSlugList } from "@/lib/catalog/filter-chips"
import { getProductTypeId } from "@/lib/catalog/product-types"

export const dynamic = "force-dynamic"

const DEFAULT_LIMIT = 12
const MAX_LIMIT = 24

type PublicScarfImage = {
  url: string
  width: number
  height: number
  alt: string
}

type PublicScarfDoc = {
  id: string | number
  slug: string
  title: string
  price: number
  image: PublicScarfImage | null
  /** Sold in sizes/colours — the card links to the product page instead of adding to cart. */
  hasVariants: boolean
  /** Real stock — the card shows "Plus que N" for the last pieces. */
  stockQuantity: number
}

/** Rejects anything that isn't a plain integer string (no floats, no "1e3", no whitespace-only). */
function parseStrictInt(raw: string): number | null {
  if (!/^-?\d+$/.test(raw)) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function readPrimaryImage(doc: Record<string, unknown>): PublicScarfImage | null {
  const featured = doc.featuredImage
  if (!featured || typeof featured !== "object") return null
  const media = featured as Record<string, unknown>
  const url = typeof media.url === "string" ? media.url : null
  if (!url) return null
  return {
    url,
    width: typeof media.width === "number" ? media.width : 0,
    height: typeof media.height === "number" ? media.height : 0,
    alt: typeof media.alt === "string" ? media.alt : "",
  }
}

/**
 * Public, read-only view of `scarves` for client components (the homepage's infinite-scroll
 * grid) that can't use Payload's Local API directly. Deliberately NOT `/api/scarves` —
 * that's Payload's own auto-generated REST route, and its real `access.read` rule 403s
 * unauthenticated browser requests. This route runs server-side via the Local API instead
 * (which bypasses access control by default — the same way every other storefront page in
 * this codebase already reads `scarves`), so Payload's access control is never touched.
 *
 * Only whitelisted fields are ever returned — never the raw Payload doc.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const rawPage = searchParams.get("page")
  const rawLimit = searchParams.get("limit")

  let page = 1
  if (rawPage !== null) {
    const parsed = parseStrictInt(rawPage)
    if (parsed === null) {
      return NextResponse.json({ error: "Invalid \"page\" parameter." }, { status: 400 })
    }
    page = Math.max(1, parsed)
  }

  let limit = DEFAULT_LIMIT
  if (rawLimit !== null) {
    const parsed = parseStrictInt(rawLimit)
    if (parsed === null) {
      return NextResponse.json({ error: "Invalid \"limit\" parameter." }, { status: 400 })
    }
    limit = Math.min(MAX_LIMIT, Math.max(1, parsed))
  }

  // Optional filters: `type=<product type slug>` (e.g. "chales") and
  // `exclude=1,2,3` (ids already shown elsewhere on the page, e.g. the best-sellers rail).
  const rawType = searchParams.get("type")
  if (rawType !== null && !/^[a-z0-9-]{1,40}$/.test(rawType)) {
    return NextResponse.json({ error: "Invalid \"type\" parameter." }, { status: 400 })
  }
  const rawExclude = searchParams.get("exclude")
  const excludeIds = rawExclude ? rawExclude.split(",").filter((s) => /^\d+$/.test(s)).slice(0, 60) : []
  // Filter chips: `tags=solid` / `categories=chales-en-crepe` (slugs, comma-separated).
  // A product matches when it has ANY of them.
  const tagSlugs = parseSlugList(searchParams.get("tags"))
  const categorySlugs = parseSlugList(searchParams.get("categories"))
  const hasChipFilter = tagSlugs.length > 0 || categorySlugs.length > 0

  try {
    const resolvedConfig = await config
    const payload = await getPayload({ config: resolvedConfig })
    const typeId = rawType ? await getProductTypeId(payload, rawType) : null
    if (rawType && typeId === null) {
      return NextResponse.json({ docs: [], hasNextPage: false, page })
    }

    const [tagIds, categoryIds] = hasChipFilter
      ? await Promise.all([
          tagSlugs.length
            ? payload
                .find({ collection: "tags", where: { slug: { in: tagSlugs } }, depth: 0, limit: 20, overrideAccess: true })
                .then((r) => r.docs.map((d) => d.id))
            : Promise.resolve([]),
          categorySlugs.length
            ? payload
                .find({ collection: "categories", where: { slug: { in: categorySlugs } }, depth: 0, limit: 20, overrideAccess: true })
                .then((r) => r.docs.map((d) => d.id))
            : Promise.resolve([]),
        ])
      : [[], []]
    if (hasChipFilter && tagIds.length === 0 && categoryIds.length === 0) {
      return NextResponse.json({ docs: [], hasNextPage: false, page })
    }

    // Same filter + sort as the existing collection pages (`getAllScarvesWithAvailability`
    // in `getScarvesStorefront.ts`) — there's no separate "published" field on `scarves`,
    // `stockQuantity > 0` is the only availability gate this catalog uses.
    const res = await payload.find({
      collection: "scarves",
      where: {
        and: [
          { stockQuantity: { greater_than: 0 } },
          ...(typeId !== null ? [{ productType: { equals: typeId } }] : []),
          ...(excludeIds.length ? [{ id: { not_in: excludeIds } }] : []),
          ...(hasChipFilter
            ? [
                {
                  or: [
                    ...(tagIds.length ? [{ tags: { in: tagIds } }] : []),
                    ...(categoryIds.length ? [{ categories: { in: categoryIds } }] : []),
                  ],
                },
              ]
            : []),
        ],
      },
      depth: 1,
      page,
      limit,
      sort: "-updatedAt",
      overrideAccess: true,
    })

    const docs: PublicScarfDoc[] = res.docs.map((doc) => {
      const d = doc as Record<string, unknown>
      return {
        id: d.id as string | number,
        slug: String(d.slug ?? ""),
        title: String(d.title ?? ""),
        price: typeof d.price === "number" ? d.price : 0,
        image: readPrimaryImage(d),
        hasVariants: d.hasVariants === true,
        stockQuantity: typeof d.stockQuantity === "number" ? d.stockQuantity : 0,
      }
    })

    return NextResponse.json({
      docs,
      hasNextPage: Boolean(res.hasNextPage),
      page: res.page ?? page,
    })
  } catch (error) {
    console.error("[api/public/scarves]", error)
    return NextResponse.json({ error: "Failed to load scarves." }, { status: 500 })
  }
}
