import { NextResponse } from "next/server"
import type { MetadataRoute } from "next"

/**
 * Next's special `manifest.ts` file convention only matches at the app root in this
 * version — its route-matching regex is anchored to the very start of the app-relative
 * path (`^[\/]manifest`), unlike `icon.tsx`/`opengraph-image.tsx` which are explicitly
 * nestable (see `node_modules/next/dist/lib/metadata/is-metadata-route.js`). A
 * `manifest.ts` placed under this segment would silently never be picked up. This is a
 * plain Route Handler instead — same manifest shape, but scoped to this tool purely by
 * where it lives and by `layout.tsx`'s `metadata.manifest` link; the storefront root
 * references nothing here.
 *
 * No `icons` entry: the only logo asset in this repo (`allurina-scarf-logo.png`) is a
 * 1000x305 wordmark banner, not a square icon — using it as-is would produce a badly
 * cropped home-screen icon. Add a proper square icon asset before setting one.
 */
export function GET() {
  const manifest: MetadataRoute.Manifest = {
    name: "Allurina Orders",
    short_name: "Orders",
    start_url: "/orders_manager",
    display: "standalone",
    background_color: "#f4f3f0",
    theme_color: "#1c1917",
  }

  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json" },
  })
}
