import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"

import { getStaffUser } from "@/lib/orders-manager/getStaffUser"
import { canActivatePromoViaPanel, getActivePromoBackingStore, writeActivePromoRecord } from "@/lib/promotions/active"
import { missingWriteEnvVars } from "@/lib/promotions/activation-store"
import { getPromoDefinition } from "@/lib/promotions/registry"

export async function PATCH(req: Request) {
  const { user } = await getStaffUser()
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 })
  }

  if (!canActivatePromoViaPanel()) {
    const error =
      getActivePromoBackingStore() === "env"
        ? "Activation en lecture seule : EDGE_CONFIG n’est pas configuré, la promotion active vient de ACTIVE_PROMO_ID (nécessite un redéploiement)."
        : `Activation en lecture seule : variable(s) manquante(s) — ${missingWriteEnvVars().join(", ")}.`
    return NextResponse.json({ error }, { status: 409 })
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

  const { promoId, startsAt, endsAt } = body as { promoId?: unknown; startsAt?: unknown; endsAt?: unknown }

  if (typeof promoId !== "string" || !getPromoDefinition(promoId)) {
    return NextResponse.json({ error: "Promotion inconnue." }, { status: 400 })
  }
  if (startsAt !== undefined && (typeof startsAt !== "string" || Number.isNaN(new Date(startsAt).getTime()))) {
    return NextResponse.json({ error: "Date de début invalide." }, { status: 400 })
  }
  if (endsAt !== undefined && (typeof endsAt !== "string" || Number.isNaN(new Date(endsAt).getTime()))) {
    return NextResponse.json({ error: "Date de fin invalide." }, { status: 400 })
  }

  try {
    await writeActivePromoRecord({
      promoId,
      ...(typeof startsAt === "string" ? { startsAt } : {}),
      ...(typeof endsAt === "string" ? { endsAt } : {}),
    })
    // { expire: 0 }, not "max": "max" gives stale-while-revalidate (next visitor still
    // gets the OLD promo while a fresh one loads in the background) — an operator who
    // just flipped this expects it live immediately, not eventually.
    revalidateTag("active-promo", { expire: 0 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[orders-manager promotions PATCH]", err)
    return NextResponse.json({ error: "Écriture impossible." }, { status: 500 })
  }
}
