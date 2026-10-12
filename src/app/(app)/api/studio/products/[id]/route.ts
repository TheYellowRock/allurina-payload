import { NextResponse } from "next/server"

import { saveProduct } from "@/lib/catalog/editor-data"
import { parseProductSavePayload } from "@/lib/catalog/editor-types"
import { getStaffUser } from "@/lib/studio/getStaffUser"

type RouteContext = { params: Promise<{ id: string }> }

/** Update a product from the Studio quick editor. */
export async function PATCH(req: Request, context: RouteContext) {
  const { user, payload } = await getStaffUser()
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 })

  const { id } = await context.params
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = parseProductSavePayload(body)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

  try {
    return NextResponse.json(await saveProduct(payload, user, Number(id), parsed.data))
  } catch (e) {
    console.error("[studio products PATCH]", e)
    return NextResponse.json({ error: "Enregistrement impossible. Vérifiez les champs." }, { status: 400 })
  }
}
