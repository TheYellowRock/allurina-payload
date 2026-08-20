import { NextResponse } from "next/server"
import { getPayload } from "payload"

import config from "@payload-config"

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

  try {
    const resolvedConfig = await config
    const payload = await getPayload({ config: resolvedConfig })

    // Same filter + sort as the existing collection pages (`getAllScarvesWithAvailability`
    // in `getScarvesStorefront.ts`) — there's no separate "published" field on `scarves`,
    // `stockQuantity > 0` is the only availability gate this catalog uses.
    const res = await payload.find({
      collection: "scarves",
      where: { stockQuantity: { greater_than: 0 } },
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
