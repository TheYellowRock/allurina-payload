import { NextResponse } from "next/server"

import { getStaffUser } from "@/lib/orders-manager/getStaffUser"
import { isOrderStatus } from "@/lib/orders-manager/order-status"

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, context: RouteContext) {
  const { user, payload } = await getStaffUser()
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 })
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 })
  }

  const status = (body as { status?: unknown }).status
  if (!isOrderStatus(status)) {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 })
  }

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: "Commande introuvable." }, { status: 400 })
  }

  try {
    const updated = await payload.update({
      collection: "orders",
      id,
      data: { status },
      overrideAccess: true,
    })
    return NextResponse.json({
      id: String(updated.id),
      status: updated.status,
    })
  } catch (e) {
    console.error("[orders-manager PATCH]", e)
    return NextResponse.json(
      { error: "Mise à jour impossible." },
      { status: 500 },
    )
  }
}
