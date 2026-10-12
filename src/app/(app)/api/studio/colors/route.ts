import { NextResponse } from "next/server"

import { slugifyTitle } from "@/lib/slugifyTitle"
import { getStaffUser } from "@/lib/studio/getStaffUser"

const HEX_RE = /^#[0-9a-fA-F]{6}$/

/** Create a colour from the product editor ("+ Couleur"), so no detour through Payload. */
export async function POST(req: Request) {
  const { user, payload } = await getStaffUser()
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 })

  const body = (await req.json().catch(() => null)) as { name?: unknown; hex?: unknown } | null
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 60) : ""
  const hex = typeof body?.hex === "string" ? body.hex.trim() : ""
  if (name.length < 2) return NextResponse.json({ error: "Nom de couleur trop court." }, { status: 400 })
  if (!HEX_RE.test(hex)) return NextResponse.json({ error: "Code couleur invalide." }, { status: 400 })

  // Same name twice = same colour: return the existing one instead of a duplicate.
  const existing = await payload.find({
    collection: "colors",
    where: { name: { equals: name } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const found = existing.docs[0]
  if (found) {
    return NextResponse.json({ id: Number(found.id), label: String(found.name), hex: String(found.hex) })
  }

  const base = slugifyTitle(name) || "couleur"
  let slug = base
  for (let n = 2; ; n++) {
    const taken = await payload.count({ collection: "colors", where: { slug: { equals: slug } }, overrideAccess: true })
    if (taken.totalDocs === 0) break
    slug = `${base}-${n}`
  }

  const doc = await payload.create({
    collection: "colors",
    data: { name, slug, hex: hex.toUpperCase() },
    overrideAccess: true,
  })
  return NextResponse.json({ id: Number(doc.id), label: String(doc.name), hex: String(doc.hex) })
}
