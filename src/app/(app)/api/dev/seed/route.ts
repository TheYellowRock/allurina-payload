import { NextResponse } from "next/server"
import { getPayload } from "payload"

import config from "@payload-config"
import { seedAllurinaCatalog } from "@/lib/seedCatalog"

export const dynamic = "force-dynamic"

/**
 * Dev-only catalog seed (same logic as `npm run seed`).
 * Set `ALLOW_CATALOG_SEED=true` in `.env`, run `npm run dev`, then POST once.
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 })
  }
  if (process.env.ALLOW_CATALOG_SEED !== "true") {
    return NextResponse.json(
      {
        error:
          "Set ALLOW_CATALOG_SEED=true in .env for this route (development only).",
      },
      { status: 403 },
    )
  }

  try {
    const cfg = await config
    const payload = await getPayload({ config: cfg })
    const { scarfCount } = await seedAllurinaCatalog(payload)
    return NextResponse.json({ ok: true, scarfCount })
  } catch (e) {
    console.error("[seed api]", e)
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Seed failed" },
      { status: 500 },
    )
  }
}
