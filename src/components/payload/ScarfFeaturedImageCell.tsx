"use client"

import { storefrontMediaUrl } from "@/lib/storefront-scarf-display"

const PLACEHOLDER_SIZE = 80

type CellProps = {
  readonly cellData?: unknown
  readonly rowData?: { featuredImage?: unknown }
}

function thumbUrlFromMedia(media: unknown): string | null {
  if (!media || typeof media !== "object") return null
  const m = media as {
    url?: string
    sizes?: Record<string, { url?: string | null } | null | undefined>
  }
  const sized = m.sizes?.adminThumb?.url
  if (typeof sized === "string" && sized.length > 0) {
    return storefrontMediaUrl({ url: sized })
  }
  return storefrontMediaUrl(media)
}

/** Payload list cell: 80×80 cover preview for `scarves.featuredImage`. */
export function ScarfFeaturedImageCell(props: CellProps) {
  const value = props.cellData ?? props.rowData?.featuredImage
  const href = thumbUrlFromMedia(value)

  if (!href) {
    return (
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: PLACEHOLDER_SIZE,
          height: PLACEHOLDER_SIZE,
          background: "#e7e5e4",
          borderRadius: 4,
          verticalAlign: "middle",
        }}
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Payload admin list cell (not Next/Image)
    <img
      src={href}
      alt=""
      width={PLACEHOLDER_SIZE}
      height={PLACEHOLDER_SIZE}
      style={{
        width: PLACEHOLDER_SIZE,
        height: PLACEHOLDER_SIZE,
        objectFit: "cover",
        borderRadius: 4,
        display: "block",
        verticalAlign: "middle",
      }}
    />
  )
}
