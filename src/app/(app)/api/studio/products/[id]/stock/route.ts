import { sql } from "@payloadcms/db-postgres"
import { NextResponse } from "next/server"

import { getStaffUser } from "@/lib/studio/getStaffUser"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * Quick stock +/- from the catalogue list. One atomic SQL update (never read-then-write),
 * so it can't overwrite a stock decrement made by a checkout at the same moment. Products
 * with sizes/colours are excluded: their stock is the sum of their variants.
 */
export async function POST(req: Request, context: RouteContext) {
  const { user, payload } = await getStaffUser()
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 })

  const { id } = await context.params
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 })

  const body = (await req.json().catch(() => null)) as { delta?: unknown } | null
  const delta = body?.delta
  if (typeof delta !== "number" || !Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 1000) {
    return NextResponse.json({ error: "Variation invalide." }, { status: 400 })
  }

  const { rows } = await payload.db.execute({
    drizzle: payload.db.drizzle,
    sql: sql`
      UPDATE "scarves"
      SET "stock_quantity" = GREATEST("stock_quantity" + ${delta}, 0), "updated_at" = now()
      WHERE "id" = ${Number(id)} AND COALESCE("has_variants", false) = false
      RETURNING "stock_quantity"
    `,
  })
  const row = rows[0] as { stock_quantity?: unknown } | undefined
  if (!row) {
    return NextResponse.json(
      { error: "Produit introuvable ou à tailles/couleurs (stock géré par variante)." },
      { status: 404 },
    )
  }
  return NextResponse.json({ stockQuantity: Number(row.stock_quantity) })
}
