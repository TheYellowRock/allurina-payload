import { NextResponse } from "next/server"

import { saveProduct } from "@/lib/catalog/editor-data"
import { parseProductSavePayload } from "@/lib/catalog/editor-types"
import { getStaffUser } from "@/lib/studio/getStaffUser"

/** Create a product from the Studio quick editor. */
export async function POST(req: Request) {
  const { user, payload } = await getStaffUser()
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = parseProductSavePayload(body)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

  try {
    return NextResponse.json(await saveProduct(payload, user, null, parsed.data))
  } catch (e) {
    console.error("[studio products POST]", e)
    return NextResponse.json({ error: "Enregistrement impossible. Vérifiez les champs." }, { status: 400 })
  }
}
